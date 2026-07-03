const mongoose = require('mongoose');

const bookedSeatSchema = new mongoose.Schema(
  {
    showKey: {
      type: String,
      required: true,
      index: true,
    },
    seatId: {
      type: String,
      required: true,
    },
    reservationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookedSeatSchema.index({ showKey: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.models.BookedSeat || mongoose.model('BookedSeat', bookedSeatSchema);
