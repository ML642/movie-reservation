import { describe, expect, jest, test } from '@jest/globals';
import { ReservationService } from '../ReservationService';
import type { ReservationRepository } from '../ports/ReservationRepository';
import type { Reservation } from '../../domain/reservation';

const request = {
  movieId: 'movie-1', theaterId: 2, seats: ['A1', 'A1', ' A2 '], totalPrice: 24,
  movieName: 'Arrival', moviePoster: 'poster.jpg', theaterName: 'Cinema', movieDuration: 116,
  movieGenre: 'Drama', showtime: '19:00', bookingDate: '2026-05-01',
};

const createRepository = (): jest.Mocked<ReservationRepository> => ({
  generateId: jest.fn<ReservationRepository['generateId']>().mockReturnValue('reservation-1'),
  getBookedSeats: jest.fn<ReservationRepository['getBookedSeats']>(),
  reserve: jest.fn<ReservationRepository['reserve']>(),
  findByUserId: jest.fn<ReservationRepository['findByUserId']>(),
  findById: jest.fn<ReservationRepository['findById']>(),
  cancel: jest.fn<ReservationRepository['cancel']>(),
});

describe('ReservationService', () => {
  test('normalizes seats before reserving', async () => {
    const repository = createRepository();
    const service = new ReservationService(repository);
    repository.reserve.mockImplementation(async (reservation) => reservation);

    await service.reserve(request, 'user-1');

    expect(repository.reserve).toHaveBeenCalledWith(expect.objectContaining({
      id: 'reservation-1', userId: 'user-1', seats: ['A1', 'A2'], showKey: 'movie-1::2::2026-05-01::19:00',
    }));
  });

  test('does not cancel another user reservation', async () => {
    const repository = createRepository();
    const service = new ReservationService(repository);
    const reservation = { id: 'reservation-1', userId: 'owner-1' } as Reservation;
    repository.findById.mockResolvedValue(reservation);

    await expect(service.cancel('reservation-1', 'user-2')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  test('returns null when a reservation does not exist', async () => {
    const repository = createRepository();
    const service = new ReservationService(repository);
    repository.findById.mockResolvedValue(null);

    await expect(service.cancel('missing', 'user-1')).resolves.toBeNull();
  });
});
