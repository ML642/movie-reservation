const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    movieId: {
      type: String,
      required: true,
    },
    theaterId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    seats: {
      type: [String],
      required: true,
      default: [],
    },
    totalPrice: mongoose.Schema.Types.Mixed,
    movie: String,
    poster: String,
    date: String,
    time: String,
    seat: String,
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    theater: String,
    price: mongoose.Schema.Types.Mixed,
    bookingDate: String,
    genre: String,
    duration: mongoose.Schema.Types.Mixed,
    rating: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,
    },
    showtime: String,
    showKey: {
      type: String,
      required: true,
      index: true,
    },
    userRating: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Serves the profile/reservation-history query without an in-memory sort.
reservationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
