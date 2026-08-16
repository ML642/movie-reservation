import { expect, jest, test } from '@jest/globals';
jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    connection: {
      readyState: 0,
    },
  },
}));

const mongoose = require('mongoose').default;

const { MongooseDatabase } = require('../MongooseDatabase');


test('connects to MongoDB', async () => {
  process.env.MONGODB_URI = 'mongodb://fake-host/test';

  mongoose.connect.mockImplementation(async () => {
    mongoose.connection.readyState = 1;
  });

  const database = new MongooseDatabase();

  await database.connect();

  expect(mongoose.connect).toHaveBeenCalledWith(
    'mongodb://fake-host/test',
    { serverSelectionTimeoutMS: 5000 }
  );

  expect(database.isReady()).toBe(true);
  expect(database.getState()).toBe('connected');
});

test('returns disconnected if MongoDB is not connected', () => {
  mongoose.connection.readyState = 0;
  const database = new MongooseDatabase();

  expect(database.getState()).toBe('disconnected');
  expect(database.isReady()).toBe(false);
});
