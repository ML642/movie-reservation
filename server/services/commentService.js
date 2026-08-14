const Comment = require('../models/Comment');
const { isMongoReady } = require('../config/mongo');

const MAX_COMMENT_LENGTH = 1000;
const createCommentError = (message, code, extra = {}) => Object.assign(new Error(message), { code, ...extra });
const createStorageError = () => createCommentError('Comment storage is temporarily unavailable.', 'STORAGE_UNAVAILABLE');

const ensureMongoReady = () => {
  if (!isMongoReady()) throw createStorageError();
};

const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim();
const normalizeMovieId = (movieId) => String(movieId || '').trim();

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
  if (!normalizedMovieId) throw createCommentError('Movie id is required', 'INVALID_COMMENT');
  if (!normalizedText) throw createCommentError('Comment cannot be empty', 'INVALID_COMMENT');
  if (normalizedText.length > MAX_COMMENT_LENGTH) {
    throw createCommentError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`, 'INVALID_COMMENT');
  }
  return { movieId: normalizedMovieId, text: normalizedText };
};

const listComments = async (movieId) => {
  const normalizedMovieId = normalizeMovieId(movieId);
  if (!normalizedMovieId) throw createCommentError('Movie id is required', 'INVALID_COMMENT');
  ensureMongoReady();
  const comments = await Comment.find({ movieId: normalizedMovieId }).sort({ createdAt: -1 }).limit(100).lean();
  return comments.map(normalizeComment);
};

const addComment = async ({ movieId, userId, username, text }) => {
  const validated = validateCommentInput({ movieId, text });
  ensureMongoReady();
  return normalizeComment(
    await Comment.create({ ...validated, userId, username: String(username || 'User').trim() || 'User' })
  );
};

const updateComment = async ({ commentId, userId, text }) => {
  const { text: normalizedText } = validateCommentInput({ movieId: 'placeholder', text });
  const id = String(commentId || '').trim();
  if (!id) throw createCommentError('Comment id is required', 'INVALID_COMMENT');
  ensureMongoReady();

  try {
    const updated = await Comment.findOneAndUpdate({ _id: id, userId }, { $set: { text: normalizedText } }, { new: true }).lean();
    if (updated) return normalizeComment(updated);
    if (await Comment.exists({ _id: id })) throw createCommentError('Forbidden: not your comment', 'FORBIDDEN');
    return null;
  } catch (error) {
    if (error.code === 'FORBIDDEN' || error.name === 'CastError') throw error;
    throw error;
  }
};

const removeComment = async ({ commentId, userId }) => {
  const id = String(commentId || '').trim();
  if (!id) throw createCommentError('Comment id is required', 'INVALID_COMMENT');
  ensureMongoReady();

  try {
    const deleted = await Comment.findOneAndDelete({ _id: id, userId }).lean();
    if (deleted) return normalizeComment(deleted);
    if (await Comment.exists({ _id: id })) throw createCommentError('Forbidden: not your comment', 'FORBIDDEN');
    return null;
  } catch (error) {
    if (error.code === 'FORBIDDEN' || error.name === 'CastError') throw error;
    throw error;
  }
};

module.exports = { listComments, addComment, updateComment, removeComment, _internal: { validateCommentInput } };
