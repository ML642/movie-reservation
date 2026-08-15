import mongoose, { type Model } from 'mongoose';

const bookedSeatSchema = new mongoose.Schema(
  {
    showKey: { type: String, required: true, index: true },
    seatId: { type: String, required: true },
    reservationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

bookedSeatSchema.index({ showKey: 1, seatId: 1 }, { unique: true });

export const BookedSeatModel: Model<Record<string, unknown>> =
  (mongoose.models.BookedSeat as Model<Record<string, unknown>>) || mongoose.model<Record<string, unknown>>('BookedSeat', bookedSeatSchema);
