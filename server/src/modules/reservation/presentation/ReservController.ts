import type { RequestHandler } from 'express';
import { ReservationError } from '../domain/ReservationError';
import type { ReservationService } from '../application/ReservationService';

type AuthenticatedRequest = Parameters<RequestHandler>[0] & { user?: { userId: string } };
const routeValue = (value: unknown): string => {
  if (Array.isArray(value)) return routeValue(value[0]);
  return typeof value === 'string' ? value : '';
};

const handleError = (
  error: unknown,
  response: Parameters<RequestHandler>[1],
  fallback: string,
  includeSeats = false,
  includeData = false
): void => {
  if (error instanceof ReservationError) {
    const status = error.code === 'CONFLICT_SEATS' ? 409 : error.code === 'STORAGE_UNAVAILABLE' ? 503 : error.code === 'FORBIDDEN' ? 403 : 400;
    response.status(status).json({
      success: false,
      message: error.message,
      ...(error.conflictingSeats ? { conflictingSeats: error.conflictingSeats } : {}),
      ...(includeSeats && error.code !== 'INVALID_SHOW' ? { bookedSeats: [] } : {}),
      ...(includeData ? { data: [] } : {}),
    });
    return;
  }
  console.error('Reservation operation error:', error);
  response.status(500).json({
    success: false,
    message: fallback,
    ...(includeSeats ? { bookedSeats: [] } : {}),
    ...(includeData ? { data: [] } : {}),
  });
};

export interface ReservationController {
  getSeats: RequestHandler;
  createReservation: RequestHandler;
  getAllForUser: RequestHandler;
  getByUserId: RequestHandler;
  deleteReservation: RequestHandler;
}

export const createReservationController = (service: ReservationService): ReservationController => ({
  getSeats: async (request, response) => {
    try {
      const bookedSeats = await service.getBookedSeats({
        movieId: routeValue(request.query.movieId),
        theaterId: routeValue(request.query.theaterId),
        bookingDate: routeValue(request.query.date) || routeValue(request.query.bookingDate),
        showtime: routeValue(request.query.time) || routeValue(request.query.showtime),
      });
      response.status(200).json({ success: true, bookedSeats });
    } catch (error) {
      handleError(error, response, 'Error loading booked seats', true);
    }
  },

  createReservation: async (request, response) => {
    const userId = (request as AuthenticatedRequest).user?.userId;
    if (!userId) {
      response.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
    try {
      const reservation = await service.reserve(request.body, userId);
      response.status(201).json({ success: true, message: 'Reservation created successfully', data: reservation });
    } catch (error) {
      handleError(error, response, 'Error creating reservation');
    }
  },

  getAllForUser: async (request, response) => {
    try {
      const data = await service.listForUser((request as AuthenticatedRequest).user?.userId || '');
      response.status(200).json({ success: true, data });
    } catch (error) {
      handleError(error, response, 'Error loading reservations', false, true);
    }
  },

  getByUserId: async (request, response) => {
    const userId = (request as AuthenticatedRequest).user?.userId;
    if (!userId) {
      response.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }
    try {
      const data = await service.listForUser(userId);
      response.status(200).json({ success: true, data });
    } catch (error) {
      handleError(error, response, 'Error loading reservations', false, true);
    }
  },

  deleteReservation: async (request, response) => {
    try {
      const reservation = await service.cancel(routeValue(request.params.id), (request as AuthenticatedRequest).user?.userId || '');
      if (!reservation) {
        response.status(404).json({ success: false, message: 'Reservation not found' });
        return;
      }
      response.status(200).json({ success: true, message: 'Reservation cancelled successfully', data: reservation });
    } catch (error) {
      handleError(error, response, 'Error cancelling reservation');
    }
  },
});
