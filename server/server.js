const listEndpoints = require('express-list-routes');
const app = require('./app');
const { connectMongo, getMongoReadyStateLabel, isMongoReady } = require('./config/mongo');
const userService = require('./services/userService');
const User = require('./models/User');
const Reservation = require('./models/Reservation');
const BookedSeat = require('./models/BookedSeat');
const LikedMovie = require('./models/LikedMovie');
const Comment = require('./models/Comment');

const PORT = process.env.PORT || 5000;

const warmMongoIndexes = async () => {
  if (!isMongoReady()) return;

  try {
    await Promise.all([User.init(), Reservation.init(), BookedSeat.init(), LikedMovie.init(), Comment.init()]);
    console.log('MongoDB indexes: ready.');
  } catch (error) {
    // The service can still use existing indexes; do not turn an index maintenance
    // problem into an application outage.
    console.warn('MongoDB indexes: warm-up failed.', { name: error.name, message: error.message });
  }
};

const startServer = async (port = PORT) => {
  // Do not accept traffic while MongoDB is still connecting. This prevents the
  // first browser requests from spending several seconds polling for readiness.
  await connectMongo();
  await userService.initDemoUser();
  await warmMongoIndexes();

  const server = app.listen(port, () => {
    console.log(listEndpoints(app));
    console.log(`Server listening on port ${port}`);
    console.log(`MongoDB startup state: ${getMongoReadyStateLabel()}`);
  });

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start server.', error);
    process.exitCode = 1;
  });
}

module.exports = { startServer, warmMongoIndexes };
