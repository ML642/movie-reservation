const cors = require('cors');
const express = require('express');
const { database } = require('../build/Shared/Infrastructure/database/MongooseDatabase');

const createServiceApp = () => {
  const app = express();
  app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','), credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', mongo: database.getState() }));
  return app;
};

const start = async (app, port) => {
  await database.connect();
  return app.listen(port, () => console.log(`Service listening on port ${port}`));
};

module.exports = { createServiceApp, database, start };
