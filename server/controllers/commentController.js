const commentService = require('../services/commentService');

const getUserId = (req) => req.user?.userId;
const getUsername = (req) => req.user?.username || 'User';

const listComments = async (req, res) => {
  try {
    const comments = await commentService.listComments(req.params.movieId);
    return res.json({ success: true, data: comments });
  } catch (error) {
    if (error.code === 'INVALID_COMMENT') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Comment list error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load comments' });
  }
};

const addComment = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  try {
    const comment = await commentService.addComment({
      movieId: req.params.movieId,
      userId,
      username: getUsername(req),
      text: req.body.text,
    });
    return res.status(201).json({ success: true, data: comment });
  } catch (error) {
    if (error.code === 'INVALID_COMMENT') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Comment create error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save comment' });
  }
};

const updateComment = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  try {
    const comment = await commentService.updateComment({
      commentId: req.params.commentId,
      userId,
      text: req.body.text,
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    return res.json({ success: true, data: comment });
  } catch (error) {
    if (error.code === 'INVALID_COMMENT') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Comment update error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update comment' });
  }
};

const removeComment = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  try {
    const comment = await commentService.removeComment({
      commentId: req.params.commentId,
      userId,
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    return res.json({ success: true, commentId: req.params.commentId });
  } catch (error) {
    if (error.code === 'INVALID_COMMENT') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Comment delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete comment' });
  }
};

module.exports = {
  listComments,
  addComment,
  updateComment,
  removeComment,
};
