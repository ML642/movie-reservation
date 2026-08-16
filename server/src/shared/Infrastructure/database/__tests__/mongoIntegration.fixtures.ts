import { describe } from '@jest/globals';
import mongoose from 'mongoose';
import { database } from '../MongooseDatabase';

export const describeWithMongo = process.env.TEST_MONGODB_URI ? describe : describe.skip;

export const connectTestDatabase = async (): Promise<void> => {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri) throw new Error('TEST_MONGODB_URI must be configured');
  process.env.MONGODB_URI = uri;
  await database.connect();
};

export const disconnectTestDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
