const reservationService = require('../services/reservationService');

const getSeats = async (req, res) => {
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

  try {
    return res.status(200).json({
      success: true,
      bookedSeats: await reservationService.getBookedSeats(showKey),
    });
  } catch (err) {
    if (err.code === 'STORAGE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: err.message,
        bookedSeats: [],
      });
    }
    console.error('Seat sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error loading booked seats',
      bookedSeats: [],
    });
  }
};

const createReservation = async (req, res) => {
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
    const reservation = await reservationService.createReservation(payload, userId);
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
    if (err.code === 'INVALID_SEATS') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err.code === 'STORAGE_UNAVAILABLE') {
      return res.status(503).json({
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

const getAllForUser = async (req, res) => {
  const { userId } = req.user || {};
  try {
    const userReservations = await reservationService.findReservationsByUser(userId);
    return res.status(200).json({
      success: true,
      data: userReservations,
    });
  } catch (err) {
    if (err.code === 'STORAGE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: err.message,
        data: [],
      });
    }
    console.error('Reservation list error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error loading reservations',
      data: [],
    });
  }
};

const getByUserId = async (req, res) => {
  const { userId } = req.user || {};
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }
  try {
    const userReservations = await reservationService.findReservationsByUser(userId);
    return res.status(200).json({
      success: true,
      data: userReservations,
    });
  } catch (err) {
    if (err.code === 'STORAGE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: err.message,
        data: [],
      });
    }
    console.error('Reservation lookup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error loading reservations',
      data: [],
    });
  }
};

const deleteReservation = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.user || {};

  try {
    const reservation = await reservationService.findReservationById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    const cancelled = await reservationService.cancelReservation(reservation, userId);
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
    if (err.code === 'STORAGE_UNAVAILABLE') {
      return res.status(503).json({
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
