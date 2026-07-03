import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheck, FaComments, FaPen, FaTimes, FaTrash } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';
import { getUserFromToken } from '../../utils/jwtDecoder';
import './CommentsSection.css';

const MAX_COMMENT_LENGTH = 1000;

const formatCommentDate = (dateValue) => {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getCommentId = (comment) => comment.id || comment._id;

const CommentsSection = ({ movieId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [currentUser] = useState(() => getUserFromToken());
  const currentUserId = currentUser?.userId || currentUser?.id;

  const getAuthHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

  const fetchComments = useCallback(async () => {
    if (!movieId) return;

    setIsLoading(true);
    setMessage('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/comments/${movieId}`);
      setComments(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedText = text.trim();
    if (!normalizedText) {
      setMessage('Comment cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/comments/${movieId}`,
        { text: normalizedText },
        { headers: getAuthHeaders() }
      );
      setComments((prev) => [response.data.data, ...prev]);
      setText('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (comment) => {
    setEditingId(getCommentId(comment));
    setEditingText(comment.text || '');
    setMessage('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEditing = async (commentId) => {
    const normalizedText = editingText.trim();
    if (!normalizedText) {
      setMessage('Comment cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/comments/${commentId}`,
        { text: normalizedText },
        { headers: getAuthHeaders() }
      );
      setComments((prev) => prev.map((comment) => (getCommentId(comment) === commentId ? response.data.data : comment)));
      cancelEditing();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeComment = async (commentId) => {
    setIsSubmitting(true);
    setMessage('');
    try {
      await axios.delete(`${API_BASE_URL}/api/comments/${commentId}`, {
        headers: getAuthHeaders(),
      });
      setComments((prev) => prev.filter((comment) => getCommentId(comment) !== commentId));
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="comments-section">
      <div className="comments-header">
        <div>
          <span className="comments-kicker">
            <FaComments /> Audience comments
          </span>
          <h2>Comments</h2>
        </div>
        <span className="comments-count">{comments.length}</span>
      </div>

      {currentUserId ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setMessage('');
            }}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="Share your take on this movie"
          />
          <div className="comment-form-footer">
            <span>{MAX_COMMENT_LENGTH - text.length} characters left</span>
            <button type="submit" disabled={isSubmitting || !text.trim()}>
              Post
            </button>
          </div>
        </form>
      ) : (
        <div className="comments-signin">
          <span>Sign in to join the conversation.</span>
          <a href="/login">Sign in</a>
        </div>
      )}

      {message ? <div className="comments-message">{message}</div> : null}

      <div className="comments-list">
        {isLoading ? (
          <div className="comments-empty">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet.</div>
        ) : (
          comments.map((comment) => {
            const commentId = getCommentId(comment);
            const isOwner = currentUserId && comment.userId === currentUserId;
            const isEditing = editingId === commentId;

            return (
              <article className="comment-card" key={commentId}>
                <div className="comment-avatar" aria-hidden="true">
                  {(comment.username || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <strong>{comment.username || 'User'}</strong>
                    <span>{formatCommentDate(comment.createdAt)}</span>
                  </div>

                  {isEditing ? (
                    <div className="comment-edit">
                      <textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        maxLength={MAX_COMMENT_LENGTH}
                      />
                      <div className="comment-actions">
                        <button type="button" onClick={() => saveEditing(commentId)} disabled={isSubmitting}>
                          <FaCheck />
                          Save
                        </button>
                        <button type="button" onClick={cancelEditing} disabled={isSubmitting}>
                          <FaTimes />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{comment.text}</p>
                  )}
                </div>

                {isOwner && !isEditing ? (
                  <div className="comment-owner-actions">
                    <button type="button" onClick={() => startEditing(comment)} aria-label="Edit comment">
                      <FaPen />
                    </button>
                    <button type="button" onClick={() => removeComment(commentId)} aria-label="Delete comment">
                      <FaTrash />
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default CommentsSection;
