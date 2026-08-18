import mongoose, { type Model } from 'mongoose';
import type { UserRecord } from '../interfaces/UserRecord';

const userSchema = new mongoose.Schema<UserRecord>(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

export const UserModel: Model<UserRecord> =
  (mongoose.models.User as Model<UserRecord>) || mongoose.model<UserRecord>('User', userSchema);
