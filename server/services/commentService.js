const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const { isMongoReady } = require('../config/mongo');

const MAX_COMMENT_LENGTH = 1000;
const memoryComments = [];

const createCommentError = (message, code, extra = {}) => Object.assign(new Error(message), { code, ...extra });

const waitForMongoReady = async (timeoutMs = 3000) => {
  if (isMongoReady()) return true;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isMongoReady()) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return isMongoReady();
};

const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim();
const normalizeMovieId = (movieId) => String(movieId || '').trim();
const generateMemoryId = () => new mongoose.Types.ObjectId().toString();

const normalizeComment = (comment) => {
  if (!comment) return null;
  const plain = comment.toObject ? comment.toObject() : comment;

  return {
    id: plain.id || plain._id?.toString(),
    _id: plain._id?.toString(),
    movieId: plain.movieId,
    userId: plain.userId,
    username: plain.username,
    text: plain.text,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const validateCommentInput = ({ movieId, text }) => {
  const normalizedMovieId = normalizeMovieId(movieId);
  const normalizedText = normalizeText(text);

  if (!normalizedMovieId) {
    throw createCommentError('Movie id is required', 'INVALID_COMMENT');
  }

  if (!normalizedText) {
    throw createCommentError('Comment cannot be empty', 'INVALID_COMMENT');
  }

  if (normalizedText.length > MAX_COMMENT_LENGTH) {
    throw createCommentError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`, 'INVALID_COMMENT');
  }

  return {
    movieId: normalizedMovieId,
    text: normalizedText,
  };
};

const listMemoryComments = (movieId) =>
  memoryComments
    .filter((comment) => comment.movieId === movieId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const listComments = async (movieId) => {
  const normalizedMovieId = normalizeMovieId(movieId);
  if (!normalizedMovieId) {
    throw createCommentError('Movie id is required', 'INVALID_COMMENT');
  }

  if (await waitForMongoReady()) {
    try {
      const comments = await Comment.find({ movieId: normalizedMovieId }).sort({ createdAt: -1 }).limit(100).lean();
      return comments.map(normalizeComment);
    } catch (error) {
      console.warn('Falling back to memory comments after Mongo read failed.', error.message);
    }
  }

  return listMemoryComments(normalizedMovieId);
};

const addComment = async ({ movieId, userId, username, text }) => {
  const validated = validateCommentInput({ movieId, text });
  const authorName = String(username || 'User').trim() || 'User';
  const comment = {
    ...validated,
    userId,
    username: authorName,
  };

  if (await waitForMongoReady()) {
    try {
      return normalizeComment(await Comment.create(comment));
    } catch (error) {
      console.warn('Falling back to memory comments after Mongo write failed.', error.message);
    }
  }

  const fallbackComment = {
    id: generateMemoryId(),
    ...comment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryComments.unshift(fallbackComment);
  return fallbackComment;
};

const updateMemoryComment = (commentId, userId, text) => {
  const comment = memoryComments.find((item) => item.id === commentId || item._id === commentId);
  if (!comment) return null;

  if (comment.userId !== userId) {
    throw createCommentError('Forbidden: not your comment', 'FORBIDDEN');
  }

  comment.text = text;
  comment.updatedAt = new Date().toISOString();
  return comment;
};

const updateComment = async ({ commentId, userId, text }) => {
  const { text: normalizedText } = validateCommentInput({ movieId: 'placeholder', text });
  const id = String(commentId || '').trim();
  if (!id) {
    throw createCommentError('Comment id is required', 'INVALID_COMMENT');
  }

  if (await waitForMongoReady()) {
    try {
      const existing = await Comment.findById(id).lean();
      if (!existing) return null;
      if (existing.userId !== userId) {
        throw createCommentError('Forbidden: not your comment', 'FORBIDDEN');
      }

      return normalizeComment(
        await Comment.findByIdAndUpdate(id, { $set: { text: normalizedText } }, { new: true }).lean()
      );
    } catch (error) {
      if (error.code === 'FORBIDDEN') throw error;
      if (error.name !== 'CastError') {
        console.warn('Falling back to memory comments after Mongo update failed.', error.message);
      }
    }
  }

  return updateMemoryComment(id, userId, normalizedText);
};

const removeMemoryComment = (commentId, userId) => {
  const index = memoryComments.findIndex((item) => item.id === commentId || item._id === commentId);
  if (index < 0) return null;

  if (memoryComments[index].userId !== userId) {
    throw createCommentError('Forbidden: not your comment', 'FORBIDDEN');
  }

  const [removed] = memoryComments.splice(index, 1);
  return removed;
};

const removeComment = async ({ commentId, userId }) => {
  const id = String(commentId || '').trim();
  if (!id) {
    throw createCommentError('Comment id is required', 'INVALID_COMMENT');
  }

  if (await waitForMongoReady()) {
    try {
      const existing = await Comment.findById(id).lean();
      if (!existing) return null;
      if (existing.userId !== userId) {
        throw createCommentError('Forbidden: not your comment', 'FORBIDDEN');
      }

      await Comment.deleteOne({ _id: id });
      return normalizeComment(existing);
    } catch (error) {
      if (error.code === 'FORBIDDEN') throw error;
      if (error.name !== 'CastError') {
        console.warn('Falling back to memory comments after Mongo delete failed.', error.message);
      }
    }
  }

  return removeMemoryComment(id, userId);
};

module.exports = {
  listComments,
  addComment,
  updateComment,
  removeComment,
  _internal: {
    memoryComments,
    validateCommentInput,
  },
};
