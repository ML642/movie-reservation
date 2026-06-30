const { getUsernameFromToken } = require('../utils/auth');

let LastId = 0;
const Reservations = [];
const ShowSeatAvailability = new Map();

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

const generateId = () => (++LastId).toString();

const createReservation = (payload, userId) => {
  const {
    movieId,
    theaterId,
    seats,
    totalPrice,
    movieName,
    moviePoster,
    theaterName,
    movieDuration,
    movieGenre,
    showtime,
    bookingDate,
  } = payload;

  const showKey = buildShowKey({ movieId, theaterId, bookingDate, showtime });
  if (!showKey) {
    const err = new Error('Invalid show date/time');
    err.code = 'INVALID_SHOW';
    throw err;
  }

  const bookedSeats = getOrCreateSeatSet(showKey);
  const conflictingSeats = seats.filter((seatId) => bookedSeats.has(seatId));
  if (conflictingSeats.length > 0) {
    const err = new Error('Some seats are already taken');
    err.code = 'CONFLICT_SEATS';
    err.conflictingSeats = conflictingSeats;
    throw err;
  }

  seats.forEach((s) => bookedSeats.add(s));

  const id = generateId();
  const reservation = {
    id,
    userId,
    movieId,
    seats,
    totalPrice,
    createdAt: new Date().toISOString(),
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

  Reservations.push(reservation);
  return reservation;
};

const findReservationsByUser = (userId) => {
  return Reservations.filter((r) => getReservationOwnerId(r) === userId);
};

const findReservationById = (id) => Reservations.find((r) => r.id === id);

const cancelReservation = (reservation, userId) => {
  const reservationOwnerId = getReservationOwnerId(reservation);
  if (!reservationOwnerId || reservationOwnerId !== userId) {
    const err = new Error('Forbidden: not your reservation');
    err.code = 'FORBIDDEN';
    throw err;
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

module.exports = {
  buildShowKey,
  normalizeShowDate,
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
  },
};