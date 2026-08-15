import type { Reservation } from '../../domain/reservation';

export interface ReservationRepository {
  generateId(): string;
  getBookedSeats(showKey: string): Promise<string[]>;
  reserve(reservation: Reservation): Promise<Reservation>;
  findByUserId(userId: string): Promise<Reservation[]>;
  findById(id: string): Promise<Reservation | null>;
  cancel(reservation: Reservation): Promise<Reservation>;
}
