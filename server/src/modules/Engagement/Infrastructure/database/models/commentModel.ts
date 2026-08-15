import mongoose, { type Model } from 'mongoose';
import type { CommentRecord } from '../interfaces/CommentRecord';

const commentSchema = new mongoose.Schema<CommentRecord>(
  {
    movieId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

commentSchema.index({ movieId: 1, createdAt: -1 });

export const CommentModel: Model<CommentRecord> =
  (mongoose.models.Comment as Model<CommentRecord>) || mongoose.model<CommentRecord>('Comment', commentSchema);
