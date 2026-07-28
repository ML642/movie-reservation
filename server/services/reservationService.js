const mongoose = require('mongoose');
const { getUsernameFromToken } = require('../utils/auth');
const { isMongoReady } = require('../config/mongo');
const Reservation = require('../models/Reservation');
const BookedSeat = require('../models/BookedSeat');

let LastId = 0;
const Reservations = [];
const ShowSeatAvailability = new Map();
let indexesReadyPromise = null;
let transactionsSupported = null;
let transactionSupportPromise = null;

const createServiceError = (message, code, extra = {}) => Object.assign(new Error(message), { code, ...extra });

const normalizeShowDate = (dateValue) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const buildShowKey = ({ movieId, theaterId, bookingDate, showtime }) => {
  const dateKey = normalizeShowDate(bookingDate);
  if (!movieId || !theaterId || !showtime || !dateKey) return null;
  return `${movieId}::${theaterId}::${dateKey}::${showtime}`;
};

const normalizeSeats = (seats) => {
  if (!Array.isArray(seats)) return [];
  return Array.from(
    new Set(
      seats
        .map((seatId) => String(seatId || '').trim())
        .filter(Boolean)
    )
  );
};

const getOrCreateSeatSet = (showKey) => {
  if (!ShowSeatAvailability.has(showKey)) {
    ShowSeatAvailability.set(showKey, new Set());
  }
  return ShowSeatAvailability.get(showKey);
};

const releaseBookedSeats = (showKey, seats) => {
  if (!showKey || !Array.isArray(seats)) return;
  const set = ShowSeatAvailability.get(showKey);
  if (!set) return;
  seats.forEach((seatId) => set.delete(seatId));
  if (set.size === 0) ShowSeatAvailability.delete(showKey);
};

const getReservationOwnerId = (reservation) => {
  if (reservation.userId) return reservation.userId;
  if (!reservation.jwt) return null;
  const decoded = getUsernameFromToken(reservation.jwt);
  return decoded?.userId || null;
};

const generateMemoryId = () => (++LastId).toString();
const generateMongoId = () => new mongoose.Types.ObjectId().toString();

const ensureMongoReady = async () => {
  if (!isMongoReady()) {
    throw createServiceError(
      'Reservation storage is temporarily unavailable. Please try again in a moment.',
      'STORAGE_UNAVAILABLE'
    );
  }

  if (!indexesReadyPromise) {
    indexesReadyPromise = Promise.all([Reservation.init(), BookedSeat.init()]).catch((error) => {
      indexesReadyPromise = null;
      throw error;
    });
  }

  await indexesReadyPromise;
};

const getTransactionSupport = async () => {
  if (transactionsSupported !== null) return transactionsSupported;
  if (transactionSupportPromise) return transactionSupportPromise;

  transactionSupportPromise = mongoose.connection.db
    .admin()
    .command({ hello: 1 })
    .then((serverInfo) => {
      // Transactions require a replica set or mongos. The Docker development
      // database is standalone, so skip a failed transaction attempt there.
      transactionsSupported = Boolean(serverInfo.setName || serverInfo.msg === 'isdbgrid');
      return transactionsSupported;
    })
    .catch((error) => {
      // Preserve the existing transactional path when topology detection is
      // unavailable; an unsupported-transaction error still falls back safely.
      console.warn('Could not determine MongoDB transaction support.', { message: error.message });
      transactionsSupported = true;
      return transactionsSupported;
    })
    .finally(() => {
      transactionSupportPromise = null;
    });

  return transactionSupportPromise;
};

const normalizeReservation = (reservation) => {
  if (!reservation) return null;
  const plain = reservation.toObject ? reservation.toObject() : reservation;

  return {
    id: plain.id,
    userId: plain.userId,
    movieId: plain.movieId,
    seats: plain.seats || [],
    totalPrice: plain.totalPrice,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    movie: plain.movie,
    poster: plain.poster,
    date: plain.date,
    time: plain.time,
    seat: plain.seat,
    status: plain.status,
    theater: plain.theater,
    price: plain.price,
    bookingDate: plain.bookingDate,
    genre: plain.genre,
    duration: plain.duration,
    rating: plain.rating ?? 0,
    theaterId: plain.theaterId,
    showtime: plain.showtime,
    showKey: plain.showKey,
    userRating: plain.userRating,
  };
};

const buildReservation = (payload, userId, id) => {
  const {
    movieId,
    theaterId,
    totalPrice,
    movieName,
    moviePoster,
    theaterName,
    movieDuration,
    movieGenre,
    showtime,
    bookingDate,
  } = payload;

  const seats = normalizeSeats(payload.seats);
  if (seats.length === 0) {
    throw createServiceError('At least one valid seat is required', 'INVALID_SEATS');
  }

  const showKey = buildShowKey({ movieId, theaterId, bookingDate, showtime });
  if (!showKey) {
    throw createServiceError('Invalid show date/time', 'INVALID_SHOW');
  }

  return {
    id,
    userId,
    movieId: String(movieId),
    seats,
    totalPrice,
    createdAt: new Date(),
    movie: movieName,
    poster: moviePoster,
    date: bookingDate,
    time: showtime,
    seat: seats.join(', '),
    status: 'upcoming',
    theater: theaterName,
    price: totalPrice,
    bookingDate,
    genre: movieGenre,
    duration: movieDuration,
    rating: 0,
    theaterId,
    showtime,
    showKey,
  };
};

const getConflictingSeats = async (showKey, seats) => {
  const seatLocks = await BookedSeat.find({
    showKey,
    seatId: { $in: seats },
  })
    .select('seatId')
    .lean();

  const conflicts = seatLocks.map((seatLock) => seatLock.seatId);
  return conflicts.length > 0 ? conflicts : seats;
};

const throwSeatConflict = async (showKey, seats) => {
  throw createServiceError('Some seats are already taken', 'CONFLICT_SEATS', {
    conflictingSeats: await getConflictingSeats(showKey, seats),
  });
};

const isDuplicateKeyError = (error) => error?.code === 11000 || /duplicate key/i.test(error?.message || '');

const isTransactionUnsupportedError = (error) =>
  /Transaction numbers are only allowed|replica set member|mongos/i.test(error?.message || '');

const createReservationWithoutTransaction = async (reservation) => {
  const seatLocks = reservation.seats.map((seatId) => ({
    showKey: reservation.showKey,
    seatId,
    reservationId: reservation.id,
    userId: reservation.userId,
  }));

  try {
    await BookedSeat.insertMany(seatLocks, { ordered: true });
    const createdReservation = await Reservation.create(reservation);
    return normalizeReservation(createdReservation);
  } catch (error) {
    await BookedSeat.deleteMany({ reservationId: reservation.id }).catch(() => {});
    if (isDuplicateKeyError(error)) {
      await throwSeatConflict(reservation.showKey, reservation.seats);
    }
    throw error;
  }
};

const createMongoReservation = async (payload, userId) => {
  await ensureMongoReady();

  const reservation = buildReservation(payload, userId, generateMongoId());
  const seatLocks = reservation.seats.map((seatId) => ({
    showKey: reservation.showKey,
    seatId,
    reservationId: reservation.id,
    userId,
  }));

  if (!(await getTransactionSupport())) {
    return createReservationWithoutTransaction(reservation);
  }

  const session = await mongoose.startSession();
  try {
    let createdReservation = null;
    await session.withTransaction(async () => {
      await BookedSeat.insertMany(seatLocks, { session, ordered: true });
      const createdReservations = await Reservation.create([reservation], { session });
      createdReservation = createdReservations[0];
    });

    return normalizeReservation(createdReservation);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      await throwSeatConflict(reservation.showKey, reservation.seats);
    }

    if (isTransactionUnsupportedError(error)) {
      transactionsSupported = false;
      return createReservationWithoutTransaction(reservation);
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

const createMemoryReservation = (payload, userId) => {
  const reservation = buildReservation(payload, userId, generateMemoryId());
  const bookedSeats = getOrCreateSeatSet(reservation.showKey);
  const conflictingSeats = reservation.seats.filter((seatId) => bookedSeats.has(seatId));

  if (conflictingSeats.length > 0) {
    throw createServiceError('Some seats are already taken', 'CONFLICT_SEATS', { conflictingSeats });
  }

  reservation.seats.forEach((seatId) => bookedSeats.add(seatId));
  reservation.createdAt = reservation.createdAt.toISOString();
  Reservations.push(reservation);
  return reservation;
};

const getBookedSeats = async (showKey) => {
  if (process.env.RESERVATION_MEMORY_FALLBACK === 'true') {
    return Array.from(ShowSeatAvailability.get(showKey) || []).sort();
  }

  await ensureMongoReady();
  const seatLocks = await BookedSeat.find({ showKey }).select('seatId').sort({ seatId: 1 }).lean();
  return seatLocks.map((seatLock) => seatLock.seatId);
};

const createReservation = async (payload, userId) => {
  if (process.env.RESERVATION_MEMORY_FALLBACK === 'true') {
    return createMemoryReservation(payload, userId);
  }

  return createMongoReservation(payload, userId);
};

const findReservationsByUser = async (userId) => {
  if (process.env.RESERVATION_MEMORY_FALLBACK === 'true') {
    return Reservations.filter((r) => getReservationOwnerId(r) === userId);
  }

  await ensureMongoReady();
  const reservations = await Reservation.find({ userId }).sort({ createdAt: -1 }).lean();
  return reservations.map(normalizeReservation);
};

const findReservationById = async (id) => {
  if (process.env.RESERVATION_MEMORY_FALLBACK === 'true') {
    return Reservations.find((r) => r.id === id) || null;
  }

  await ensureMongoReady();
  return normalizeReservation(await Reservation.findOne({ id }).lean());
};

const cancelReservationWithoutTransaction = async (reservation) => {
  if (reservation.status !== 'cancelled') {
    await BookedSeat.deleteMany({ reservationId: reservation.id });
  }

  return normalizeReservation(
    await Reservation.findOneAndUpdate({ id: reservation.id }, { $set: { status: 'cancelled' } }, { new: true }).lean()
  );
};

const cancelMongoReservation = async (reservation, userId) => {
  const reservationOwnerId = getReservationOwnerId(reservation);
  if (!reservationOwnerId || reservationOwnerId !== userId) {
    throw createServiceError('Forbidden: not your reservation', 'FORBIDDEN');
  }

  await ensureMongoReady();

  if (!(await getTransactionSupport())) {
    return cancelReservationWithoutTransaction(reservation);
  }

  const session = await mongoose.startSession();
  try {
    let cancelledReservation = reservation;
    await session.withTransaction(async () => {
      if (reservation.status !== 'cancelled') {
        await BookedSeat.deleteMany({ reservationId: reservation.id }).session(session);
      }

      cancelledReservation = await Reservation.findOneAndUpdate(
        { id: reservation.id },
        { $set: { status: 'cancelled' } },
        { new: true, session }
      ).lean();
    });

    return normalizeReservation(cancelledReservation);
  } catch (error) {
    if (!isTransactionUnsupportedError(error)) {
      throw error;
    }

    transactionsSupported = false;
    return cancelReservationWithoutTransaction(reservation);
  } finally {
    await session.endSession();
  }
};

const cancelMemoryReservation = (reservation, userId) => {
  const reservationOwnerId = getReservationOwnerId(reservation);
  if (!reservationOwnerId || reservationOwnerId !== userId) {
    throw createServiceError('Forbidden: not your reservation', 'FORBIDDEN');
  }

  if (reservation.status !== 'cancelled') {
    const showKey =
      reservation.showKey ||
      buildShowKey({
        movieId: reservation.movieId,
        theaterId: reservation.theaterId,
        bookingDate: reservation.bookingDate || reservation.date,
        showtime: reservation.showtime || reservation.time,
      });
    releaseBookedSeats(showKey, reservation.seats);
  }

  reservation.status = 'cancelled';
  return reservation;
};

const cancelReservation = async (reservation, userId) => {
  if (process.env.RESERVATION_MEMORY_FALLBACK === 'true') {
    return cancelMemoryReservation(reservation, userId);
  }

  return cancelMongoReservation(reservation, userId);
};

module.exports = {
  buildShowKey,
  normalizeShowDate,
  getBookedSeats,
  getOrCreateSeatSet,
  releaseBookedSeats,
  getReservationOwnerId,
  createReservation,
  findReservationsByUser,
  findReservationById,
  cancelReservation,
  _internal: {
    Reservations,
    ShowSeatAvailability,
    normalizeSeats,
  },
};
