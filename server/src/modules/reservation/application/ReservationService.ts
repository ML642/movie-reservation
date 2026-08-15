import { assertReservationOwner, buildShowKey, createReservation, type Reservation, type ReservationRequest, type ShowInput } from '../domain/reservation';
import { ReservationError } from '../domain/ReservationError';
import type { ReservationRepository } from './ports/ReservationRepository';

export class ReservationService {
  constructor(private readonly repository: ReservationRepository) {}

  async getBookedSeats(show: ShowInput): Promise<string[]> {
    const showKey = buildShowKey(show);
    if (!showKey) throw new ReservationError('INVALID_SHOW', 'movieId, theaterId, date and time are required');
    return this.repository.getBookedSeats(showKey);
  }

  reserve(request: ReservationRequest, userId: string): Promise<Reservation> {
    return this.repository.reserve(createReservation(request, userId, this.repository.generateId()));
  }

  listForUser(userId: string): Promise<Reservation[]> {
    return this.repository.findByUserId(userId);
  }

  async cancel(id: string, userId: string): Promise<Reservation | null> {
    const reservation = await this.repository.findById(id);
    if (!reservation) return null;
    assertReservationOwner(reservation, userId);
    return this.repository.cancel(reservation);
  }
}
