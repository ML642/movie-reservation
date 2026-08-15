const listEndpoints = require('express-list-routes');
const app = require('./app');
const { database } = require('./build/Shared/Infrastructure/database/MongooseDatabase');

const PORT = process.env.PORT || 5000;

const startServer = async (port = PORT) => {
  // Do not accept traffic while MongoDB is still connecting. This prevents the
  // first browser requests from spending several seconds polling for readiness.
  await database.connect();

  const server = app.listen(port, () => {
    console.log(listEndpoints(app));
    console.log(`Server listening on port ${port}`);
    console.log(`MongoDB startup state: ${database.getState()}`);
  });

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start server.', error);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
