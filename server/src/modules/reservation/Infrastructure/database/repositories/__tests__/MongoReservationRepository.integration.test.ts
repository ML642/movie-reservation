import { afterAll, beforeAll, beforeEach, expect, test } from '@jest/globals';
import {
  connectTestDatabase,
  describeWithMongo,
  disconnectTestDatabase,
} from '../../../../../../shared/Infrastructure/database/__tests__/mongoIntegration.fixtures';
import { database } from '../../../../../../shared/Infrastructure/database/MongooseDatabase';
import { BookedSeatModel } from '../../models/bookedSeatModel';
import { ReservationModel } from '../../models/reservationModel';
import { MongoReservationRepository } from '../MongoReservationRepository';
import { createReservation } from '../../../../domain/reservation';

const repository = new MongoReservationRepository(ReservationModel, BookedSeatModel, database);
const request = {
  movieId: 'movie-1', theaterId: 2, seats: ['A1', 'A2'], totalPrice: 24,
  movieName: 'Arrival', moviePoster: 'poster.jpg', theaterName: 'Cinema', movieDuration: 116,
  movieGenre: 'Drama', showtime: '19:00', bookingDate: '2026-05-01',
};

describeWithMongo('MongoReservationRepository integration', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    await Promise.all([ReservationModel.init(), BookedSeatModel.init()]);
  });

  beforeEach(async () => {
    await Promise.all([ReservationModel.deleteMany({}), BookedSeatModel.deleteMany({})]);
  });

  afterAll(disconnectTestDatabase);

  test('rejects an overlapping seat and releases seats after cancellation', async () => {
    const first = createReservation(request, 'user-1', repository.generateId());
    await repository.reserve(first);
    const duplicate = createReservation({ ...request, seats: ['A2'] }, 'user-2', repository.generateId());

    await expect(repository.reserve(duplicate)).rejects.toMatchObject({ code: 'CONFLICT_SEATS', conflictingSeats: ['A2'] });
    await expect(repository.getBookedSeats(first.showKey)).resolves.toEqual(['A1', 'A2']);

    await repository.cancel(first);

    await expect(repository.getBookedSeats(first.showKey)).resolves.toEqual([]);
  });
});
