import mongoose, { type Model } from 'mongoose';
import type { LikedMovieRecord } from '../interfaces/LikedMovieRecord';

const likedMovieSchema = new mongoose.Schema<LikedMovieRecord>(
  {
    userId: { type: String, required: true, index: true },
    movieKey: { type: String, required: true },
    movieId: String,
    title: { type: String, required: true },
    poster: String,
    rating: mongoose.Schema.Types.Mixed,
    date: String,
    genre: String,
  },
  { timestamps: true }
);

likedMovieSchema.index({ userId: 1, movieKey: 1 }, { unique: true });
likedMovieSchema.index({ userId: 1, createdAt: -1 });

export const LikedMovieModel: Model<LikedMovieRecord> =
  (mongoose.models.LikedMovie as Model<LikedMovieRecord>) || mongoose.model<LikedMovieRecord>('LikedMovie', likedMovieSchema);
