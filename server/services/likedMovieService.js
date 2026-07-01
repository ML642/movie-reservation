const LikedMovie = require('../models/LikedMovie');
const { isMongoReady } = require('../config/mongo');

const memoryLikesByUser = new Map();

const getMemoryLikes = (userId) => {
  if (!memoryLikesByUser.has(userId)) {
    memoryLikesByUser.set(userId, new Map());
  }

  return memoryLikesByUser.get(userId);
};

const normalizeMovie = (movie = {}) => {
  const movieKey = String(movie.movieKey || movie.title || movie.id || movie.movieId || '').trim();
  const title = String(movie.title || movie.movieName || movieKey || '').trim();

  if (!movieKey || !title) {
    return null;
  }

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
  if (!isMongoReady()) {
    return Array.from(getMemoryLikes(userId).values());
  }

  try {
    return await LikedMovie.find({ userId }).sort({ createdAt: -1 }).lean();
  } catch (error) {
    console.warn('Falling back to memory likes after Mongo read failed.', error.message);
    return Array.from(getMemoryLikes(userId).values());
  }
};

const addLikedMovie = async (userId, movie) => {
  const normalizedMovie = normalizeMovie(movie);

  if (!normalizedMovie) {
    const error = new Error('Movie title or id is required');
    error.code = 'INVALID_MOVIE';
    throw error;
  }

  const fallbackLike = {
    ...normalizedMovie,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!isMongoReady()) {
    getMemoryLikes(userId).set(normalizedMovie.movieKey, fallbackLike);
    return fallbackLike;
  }

  try {
    return await LikedMovie.findOneAndUpdate(
      { userId, movieKey: normalizedMovie.movieKey },
      { $set: { ...normalizedMovie, userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  } catch (error) {
    console.warn('Falling back to memory likes after Mongo write failed.', error.message);
    getMemoryLikes(userId).set(normalizedMovie.movieKey, fallbackLike);
    return fallbackLike;
  }
};

const removeLikedMovie = async (userId, movieKey) => {
  const normalizedMovieKey = String(movieKey || '').trim();

  if (!normalizedMovieKey) {
    const error = new Error('Movie key is required');
    error.code = 'INVALID_MOVIE';
    throw error;
  }

  if (!isMongoReady()) {
    return getMemoryLikes(userId).delete(normalizedMovieKey);
  }

  try {
    const result = await LikedMovie.deleteOne({ userId, movieKey: normalizedMovieKey });
    return result.deletedCount > 0;
  } catch (error) {
    console.warn('Falling back to memory likes after Mongo delete failed.', error.message);
    return getMemoryLikes(userId).delete(normalizedMovieKey);
  }
};

module.exports = {
  listLikedMovies,
  addLikedMovie,
  removeLikedMovie,
  _internal: {
    memoryLikesByUser,
    normalizeMovie,
  },
};
