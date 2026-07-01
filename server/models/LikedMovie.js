const mongoose = require('mongoose');

const likedMovieSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    movieKey: {
      type: String,
      required: true,
    },
    movieId: String,
    title: {
      type: String,
      required: true,
    },
    poster: String,
    rating: mongoose.Schema.Types.Mixed,
    date: String,
    genre: String,
  },
  {
    timestamps: true,
  }
);

likedMovieSchema.index({ userId: 1, movieKey: 1 }, { unique: true });

module.exports = mongoose.models.LikedMovie || mongoose.model('LikedMovie', likedMovieSchema);
