require('dotenv').config();
const express = require('express');
const cors = require('cors');
const listEndpoints = require('express-list-routes');

const { connectMongo, getMongoReadyStateLabel } = require('./config/mongo');
const userService = require('./services/userService');

connectMongo();
userService.initDemoUser();

const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations'); // keep your split reservations router
const likedMovieRoutes = require('./routes/likedMovies');
const commentRoutes = require('./routes/comments');

const app = express();

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

const allowedOrigins = new Set([
  'https://movie-reservation-1.onrender.com',
  'https://movie-reservation-z2nv.onrender.com',
  'http://localhost:3000',
  'https://movie-reservation-1-4uao.onrender.com',
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
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));


app.use('/api', authRoutes); // register/login/userInfo/changeInfo -> /api/register, etc.
app.use('/api/reservation', reservationRoutes);
app.use('/api/likes', likedMovieRoutes);
app.use('/api/comments', commentRoutes);


app.get('/', (req, res) => res.json({ message: 'Movie Reservation API is running!' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(listEndpoints(app));
  console.log(`Server listening on port ${PORT}`);
  console.log(`MongoDB startup state: ${getMongoReadyStateLabel()}`);
});
