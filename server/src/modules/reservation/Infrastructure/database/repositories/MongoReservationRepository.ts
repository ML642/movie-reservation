import mongoose, { type Model } from 'mongoose';
import { ReservationError } from '../../../domain/ReservationError';
import type { Reservation } from '../../../domain/reservation';
import type { ReservationRepository } from '../../../application/ports/ReservationRepository';
import type { DatabaseConnection } from '../interfaces/DatabaseConnection';

type ReservationModel = Model<Record<string, unknown>>;
type BookedSeatModel = Model<Record<string, unknown>>;

export class MongoReservationRepository implements ReservationRepository {
  private indexesReady: Promise<void> | null = null;
  private transactionsSupported: boolean | null = null;
  private transactionSupportCheck: Promise<boolean> | null = null;

  constructor(
    private readonly reservationModel: ReservationModel,
    private readonly bookedSeatModel: BookedSeatModel,
    private readonly connection: DatabaseConnection
  ) {}

  generateId(): string {
    return new mongoose.Types.ObjectId().toString();
  }

  async getBookedSeats(showKey: string): Promise<string[]> {
    await this.ensureReady();
    const locks = await this.bookedSeatModel.find({ showKey }).select('seatId').sort({ seatId: 1 }).lean().exec();
    return locks.map((lock) => String(lock.seatId));
  }

  async reserve(reservation: Reservation): Promise<Reservation> {
    await this.ensureReady();
    if (!(await this.supportsTransactions())) return this.reserveWithoutTransaction(reservation);

    const session = await mongoose.startSession();
    try {
      let created: Record<string, unknown> | null = null;
      await session.withTransaction(async () => {
        await this.bookedSeatModel.insertMany(this.seatLocks(reservation), { session, ordered: true });
        const records = await this.reservationModel.create([reservation], { session });
        created = records[0].toObject() as Record<string, unknown>;
      });
      return this.toReservation(created);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) await this.throwSeatConflict(reservation);
      if (this.isTransactionUnsupportedError(error)) {
        this.transactionsSupported = false;
        return this.reserveWithoutTransaction(reservation);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    await this.ensureReady();
    const records = await this.reservationModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    return records.map((record) => this.toReservation(record));
  }

  async findById(id: string): Promise<Reservation | null> {
    await this.ensureReady();
    const record = await this.reservationModel.findOne({ id: String(id || '') }).lean().exec();
    return record ? this.toReservation(record) : null;
  }

  async cancel(reservation: Reservation): Promise<Reservation> {
    await this.ensureReady();
    if (!(await this.supportsTransactions())) return this.cancelWithoutTransaction(reservation);

    const session = await mongoose.startSession();
    try {
      let cancelled: Record<string, unknown> | null = null;
      await session.withTransaction(async () => {
        if (reservation.status !== 'cancelled') {
          await this.bookedSeatModel.deleteMany({ reservationId: reservation.id }).session(session);
        }
        cancelled = await this.reservationModel
          .findOneAndUpdate({ id: reservation.id }, { $set: { status: 'cancelled' } }, { new: true, session })
          .lean()
          .exec();
      });
      return this.toReservation(cancelled);
    } catch (error) {
      if (!this.isTransactionUnsupportedError(error)) throw error;
      this.transactionsSupported = false;
      return this.cancelWithoutTransaction(reservation);
    } finally {
      await session.endSession();
    }
  }

  private async reserveWithoutTransaction(reservation: Reservation): Promise<Reservation> {
    try {
      await this.bookedSeatModel.insertMany(this.seatLocks(reservation), { ordered: true });
      const created = await this.reservationModel.create(reservation);
      return this.toReservation(created.toObject() as Record<string, unknown>);
    } catch (error) {
      await this.bookedSeatModel.deleteMany({ reservationId: reservation.id }).exec().catch(() => undefined);
      if (this.isDuplicateKeyError(error)) await this.throwSeatConflict(reservation);
      throw error;
    }
  }

  private async cancelWithoutTransaction(reservation: Reservation): Promise<Reservation> {
    if (reservation.status !== 'cancelled') {
      await this.bookedSeatModel.deleteMany({ reservationId: reservation.id }).exec();
    }
    const cancelled = await this.reservationModel
      .findOneAndUpdate({ id: reservation.id }, { $set: { status: 'cancelled' } }, { new: true })
      .lean()
      .exec();
    return this.toReservation(cancelled);
  }

  private async ensureReady(): Promise<void> {
    if (!this.connection.isReady()) {
      throw new ReservationError('STORAGE_UNAVAILABLE', 'Reservation storage is temporarily unavailable. Please try again in a moment.');
    }
    if (!this.indexesReady) {
      this.indexesReady = Promise.all([this.reservationModel.init(), this.bookedSeatModel.init()])
        .then(() => undefined)
        .catch((error) => {
          this.indexesReady = null;
          throw error;
        });
    }
    await this.indexesReady;
  }

  private async supportsTransactions(): Promise<boolean> {
    if (this.transactionsSupported !== null) return this.transactionsSupported;
    if (this.transactionSupportCheck) return this.transactionSupportCheck;
    const database = mongoose.connection.db;
    if (!database) {
      this.transactionsSupported = false;
      return false;
    }
    this.transactionSupportCheck = database
      .admin()
      .command({ hello: 1 })
      .then((result: { setName?: string; msg?: string }) => {
        this.transactionsSupported = Boolean(result.setName || result.msg === 'isdbgrid');
        return this.transactionsSupported;
      })
      .catch(() => {
        this.transactionsSupported = true;
        return true;
      })
      .finally(() => {
        this.transactionSupportCheck = null;
      });
    return this.transactionSupportCheck;
  }

  private seatLocks(reservation: Reservation): Record<string, string>[] {
    return reservation.seats.map((seatId) => ({
      showKey: reservation.showKey,
      seatId,
      reservationId: reservation.id,
      userId: reservation.userId,
    }));
  }

  private async throwSeatConflict(reservation: Reservation): Promise<never> {
    const locks = await this.bookedSeatModel.find({ showKey: reservation.showKey, seatId: { $in: reservation.seats } }).select('seatId').lean().exec();
    const conflictingSeats = locks.map((lock) => String(lock.seatId));
    throw new ReservationError('CONFLICT_SEATS', 'Some seats are already taken', conflictingSeats.length ? conflictingSeats : reservation.seats);
  }

  private toReservation(record: Record<string, unknown> | null): Reservation {
    if (!record) throw new Error('Reservation was not saved');
    return {
      id: String(record.id),
      userId: String(record.userId),
      movieId: String(record.movieId),
      theaterId: record.theaterId as string | number,
      seats: Array.isArray(record.seats) ? record.seats.map(String) : [],
      totalPrice: record.totalPrice,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date | undefined,
      movie: String(record.movie),
      poster: record.poster as string | undefined,
      date: String(record.date),
      time: String(record.time),
      seat: String(record.seat),
      status: record.status as Reservation['status'],
      theater: String(record.theater),
      price: record.price,
      bookingDate: String(record.bookingDate),
      genre: record.genre as string | undefined,
      duration: record.duration,
      rating: Number(record.rating ?? 0),
      showtime: String(record.showtime),
      showKey: String(record.showKey),
      userRating: record.userRating,
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && ((('code' in error) && error.code === 11000) || /duplicate key/i.test(String(error)));
  }

  private isTransactionUnsupportedError(error: unknown): boolean {
    return /Transaction numbers are only allowed|replica set member|mongos/i.test(error instanceof Error ? error.message : '');
  }
}
