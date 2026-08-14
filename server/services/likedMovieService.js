const LikedMovie = require('../models/LikedMovie');
const { isMongoReady } = require('../config/mongo');

const createStorageError = () => Object.assign(new Error('Liked-movie storage is temporarily unavailable.'), {
  code: 'STORAGE_UNAVAILABLE',
});

const ensureMongoReady = () => {
  if (!isMongoReady()) throw createStorageError();
};

const normalizeMovie = (movie = {}) => {
  const movieKey = String(movie.movieKey || movie.title || movie.id || movie.movieId || '').trim();
  const title = String(movie.title || movie.movieName || movieKey || '').trim();
  if (!movieKey || !title) return null;

  return {
    movieKey,
    movieId: movie.id ? String(movie.id) : movie.movieId ? String(movie.movieId) : undefined,
    title,
    poster: movie.poster || movie.moviePoster || undefined,
    rating: movie.rating ?? movie.vote_average,
    date: movie.date || movie.release_date,
    genre: movie.genre,
  };
};

const listLikedMovies = async (userId) => {
  ensureMongoReady();
  return LikedMovie.find({ userId }).sort({ createdAt: -1 }).lean();
};

const addLikedMovie = async (userId, movie) => {
  const normalizedMovie = normalizeMovie(movie);
  if (!normalizedMovie) {
    const error = new Error('Movie title or id is required');
    error.code = 'INVALID_MOVIE';
    throw error;
  }

  ensureMongoReady();
  return LikedMovie.findOneAndUpdate(
    { userId, movieKey: normalizedMovie.movieKey },
    { $set: { ...normalizedMovie, userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
};

const removeLikedMovie = async (userId, movieKey) => {
  const normalizedMovieKey = String(movieKey || '').trim();
  if (!normalizedMovieKey) {
    const error = new Error('Movie key is required');
    error.code = 'INVALID_MOVIE';
    throw error;
  }

  ensureMongoReady();
  const result = await LikedMovie.deleteOne({ userId, movieKey: normalizedMovieKey });
  return result.deletedCount > 0;
};

module.exports = { listLikedMovies, addLikedMovie, removeLikedMovie, _internal: { normalizeMovie } };
