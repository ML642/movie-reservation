import { MongooseDatabase } from './MongooseDatabase';
import { describe, expect, it, jest ,test, beforeEach } from '@jest/globals';

const mongoose = require('mongoose').default;


jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    connection: {
      readyState: 0,
    },
  },
}));


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

test("returns desconnected if MongoDB is not connected",()=>{
        mongoose.connection.readyState = 0;
        const database = new MongooseDatabase();

        const state = database.getState()

        expect(state).toBe('disconnected');
        expect(database.isReady()).toBe(false);
})