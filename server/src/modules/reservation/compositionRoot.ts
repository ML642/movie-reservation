import { ReservationService } from './application/ReservationService';
import { MongoReservationRepository } from './Infrastructure/database/repositories/MongoReservationRepository';
import type { DatabaseConnection } from './Infrastructure/database/interfaces/DatabaseConnection';
import { BookedSeatModel } from './Infrastructure/database/models/bookedSeatModel';
import { ReservationModel } from './Infrastructure/database/models/reservationModel';
import { createReservationController } from './presentation/ReservController';
import { createReservationRoutes, type TokenVerifier } from './presentation/ReservRoutes';

export const createReservationModule = (tokenVerifier: TokenVerifier, databaseConnection: DatabaseConnection) => {
  const repository = new MongoReservationRepository(ReservationModel, BookedSeatModel, databaseConnection);
  const service = new ReservationService(repository);
  return createReservationRoutes(createReservationController(service), tokenVerifier);
};
