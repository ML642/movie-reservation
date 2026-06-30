const reservationService = require('../services/reservationService');

const getSeats = (req, res) => {
  const { movieId, theaterId, date, time, bookingDate, showtime } = req.query;
  const showKey = reservationService.buildShowKey({
    movieId,
    theaterId,
    bookingDate: date || bookingDate,
    showtime: time || showtime,
  });

  if (!showKey) {
    return res.status(400).json({
      success: false,
      message: 'movieId, theaterId, date and time are required',
    });
  }

  return res.status(200).json({
    success: true,
    bookedSeats: Array.from(reservationService.getOrCreateSeatSet(showKey)),
  });
};

const createReservation = (req, res) => {
  const { userId } = req.user || {};
  const payload = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
  const required = [
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
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
  }
  if (!Array.isArray(payload.seats) || payload.seats.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }

  try {
    const reservation = reservationService.createReservation(payload, userId);
    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation,
    });
  } catch (err) {
    if (err.code === 'CONFLICT_SEATS') {
      return res.status(409).json({
        success: false,
        message: err.message,
        conflictingSeats: err.conflictingSeats,
      });
    }
    if (err.code === 'INVALID_SHOW') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    console.error('Reservation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error creating reservation',
    });
  }
};

const getAllForUser = (req, res) => {
  const { userId } = req.user || {};
  const userReservations = reservationService.findReservationsByUser(userId);
  return res.status(200).json({
    success: true,
    data: userReservations,
  });
};

const getByUserId = (req, res) => {
  const { userId } = req.user || {};
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }
  const userReservations = reservationService.findReservationsByUser(userId);
  return res.status(200).json({
    success: true,
    data: userReservations,
  });
};

const deleteReservation = (req, res) => {
  const id = req.params.id;
  const { userId } = req.user || {};
  const reservation = reservationService.findReservationById(id);
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found',
    });
  }

  try {
    const cancelled = reservationService.cancelReservation(reservation, userId);
    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: cancelled,
    });
  } catch (err) {
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
    }
    console.error('Cancel error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
    });
  }
};

module.exports = {
  getSeats,
  createReservation,
  getAllForUser,
  getByUserId,
  deleteReservation,
};