require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { isMongoReady, getMongoReadyStateLabel } = require('./config/mongo');

const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations'); // keep your split reservations router
const likedMovieRoutes = require('./routes/likedMovies');
const commentRoutes = require('./routes/comments');

const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
  });
}

const allowedOrigins = new Set([
  'https://movie-reservation-1.onrender.com',
  'https://movie-reservation-z2nv.onrender.com',
  'http://localhost:3000',
  'https://movie-reservation-1-4uao.onrender.com',
  ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (allowedOrigins.has(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  // Browsers can reuse the successful auth/content-type preflight instead of
  // adding an OPTIONS round trip before every API interaction.
  maxAge: 7200,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));


app.use('/api', authRoutes); // register/login/userInfo/changeInfo -> /api/register, etc.
app.use('/api/reservation', reservationRoutes);
app.use('/api/likes', likedMovieRoutes);
app.use('/api/comments', commentRoutes);


app.get('/health', (req, res) =>
  res.status(200).json({
    status: 'ok',
    mongo: {
      ready: isMongoReady(),
      state: getMongoReadyStateLabel(),
    },
  })
);

app.get('/', (req, res) => res.json({ message: 'Movie Reservation API is running!' }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.message === 'Not allowed by CORS' ? 403 : err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : err.message,
  });
});

module.exports = app;
