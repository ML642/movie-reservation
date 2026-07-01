const likedMovieService = require('../services/likedMovieService');

const getUserId = (req) => req.user?.userId;

const listLikedMovies = async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  const likedMovies = await likedMovieService.listLikedMovies(userId);
  return res.json({ success: true, data: likedMovies });
};

const addLikedMovie = async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  try {
    const likedMovie = await likedMovieService.addLikedMovie(userId, req.body.movie || req.body);
    return res.status(201).json({ success: true, data: likedMovie });
  } catch (error) {
    if (error.code === 'INVALID_MOVIE') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Like create error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save liked movie' });
  }
};

const removeLikedMovie = async (req, res) => {
  const userId = getUserId(req);
  const movieKey = req.body.movieKey || req.params.movieKey;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  try {
    await likedMovieService.removeLikedMovie(userId, movieKey);
    return res.json({ success: true, movieKey });
  } catch (error) {
    if (error.code === 'INVALID_MOVIE') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Like delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to remove liked movie' });
  }
};

module.exports = {
  listLikedMovies,
  addLikedMovie,
  removeLikedMovie,
};
