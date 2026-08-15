import { ReservationError } from './ReservationError';

export interface ReservationRequest {
  movieId?: string | number;
  theaterId?: string | number;
  seats?: unknown;
  totalPrice?: unknown;
  movieName?: string;
  moviePoster?: string;
  theaterName?: string;
  movieDuration?: unknown;
  movieGenre?: string;
  showtime?: string;
  bookingDate?: string;
}

export interface ShowInput {
  movieId?: string | number;
  theaterId?: string | number;
  bookingDate?: string;
  showtime?: string;
}

export interface Reservation {
  id: string;
  userId: string;
  movieId: string;
  theaterId: string | number;
  seats: string[];
  totalPrice: unknown;
  createdAt: Date;
  movie: string;
  poster?: string;
  date: string;
  time: string;
  seat: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  theater: string;
  price: unknown;
  bookingDate: string;
  genre?: string;
  duration: unknown;
  rating: number;
  showtime: string;
  showKey: string;
  updatedAt?: Date;
  userRating?: unknown;
}

const requiredFields: Array<keyof ReservationRequest> = [
  'movieId',
  'seats',
  'totalPrice',
  'showtime',
  'theaterId',
  'movieName',
  'moviePoster',
  'theaterName',
  'movieDuration',
  'movieGenre',
  'bookingDate',
];

export const normalizeShowDate = (dateValue: string | undefined): string | null => {
  const parsed = new Date(String(dateValue || ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

export const buildShowKey = ({ movieId, theaterId, bookingDate, showtime }: ShowInput): string | null => {
  const dateKey = normalizeShowDate(bookingDate);
  if (!movieId || !theaterId || !showtime || !dateKey) return null;
  return `${movieId}::${theaterId}::${dateKey}::${showtime}`;
};

export const normalizeSeats = (seats: unknown): string[] => {
  if (!Array.isArray(seats)) return [];
  return Array.from(new Set(seats.map((seat) => String(seat || '').trim()).filter(Boolean)));
};

export const createReservation = (request: ReservationRequest, userId: string, id: string): Reservation => {
  for (const field of requiredFields) {
    if (request[field] === undefined || request[field] === null) {
      throw new ReservationError('MISSING_FIELDS', 'Missing required fields');
    }
  }

  const seats = normalizeSeats(request.seats);
  if (!seats.length) throw new ReservationError('INVALID_SEATS', 'At least one valid seat is required');

  const showKey = buildShowKey(request);
  if (!showKey) throw new ReservationError('INVALID_SHOW', 'Invalid show date/time');

  return {
    id,
    userId: String(userId),
    movieId: String(request.movieId),
    theaterId: request.theaterId as string | number,
    seats,
    totalPrice: request.totalPrice,
    createdAt: new Date(),
    movie: String(request.movieName),
    poster: request.moviePoster,
    date: String(request.bookingDate),
    time: String(request.showtime),
    seat: seats.join(', '),
    status: 'upcoming',
    theater: String(request.theaterName),
    price: request.totalPrice,
    bookingDate: String(request.bookingDate),
    genre: request.movieGenre,
    duration: request.movieDuration,
    rating: 0,
    showtime: String(request.showtime),
    showKey,
  };
};

export const assertReservationOwner = (reservation: Reservation, userId: string): void => {
  if (!reservation.userId || reservation.userId !== userId) {
    throw new ReservationError('FORBIDDEN', 'Forbidden: not your reservation');
  }
};
