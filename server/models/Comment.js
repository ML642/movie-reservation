const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    movieId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ movieId: 1, createdAt: -1 });

module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
