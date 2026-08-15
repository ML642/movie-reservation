import { EngagementError } from './EngagementError';

export const MAX_COMMENT_LENGTH = 1000;

export interface CommentInput {
  movieId: string;
  userId: string;
  username: string;
  text: string;
}

export interface CommentChange {
  text: string;
}

export interface MovieComment extends CommentInput {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const normalizeCommentText = (text: string) => String(text || '').replace(/\s+/g, ' ').trim();
export const normalizeMovieId = (movieId: string) => String(movieId || '').trim();

export const createCommentInput = (input: CommentInput): CommentInput => {
  const movieId = normalizeMovieId(input.movieId);
  const text = normalizeCommentText(input.text);
  const username = String(input.username || 'User').trim() || 'User';

  if (!movieId) throw new EngagementError('INVALID_COMMENT', 'Movie id is required');
  if (!input.userId) throw new EngagementError('INVALID_COMMENT', 'User id is required');
  if (!text) throw new EngagementError('INVALID_COMMENT', 'Comment cannot be empty');
  if (text.length > MAX_COMMENT_LENGTH) {
    throw new EngagementError('INVALID_COMMENT', `Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
  }

  return { movieId, userId: String(input.userId), username, text };
};

export const createCommentChange = (text: string): CommentChange => {
  const normalizedText = normalizeCommentText(text);
  if (!normalizedText) throw new EngagementError('INVALID_COMMENT', 'Comment cannot be empty');
  if (normalizedText.length > MAX_COMMENT_LENGTH) {
    throw new EngagementError('INVALID_COMMENT', `Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
  }
  return { text: normalizedText };
};

export const normalizeCommentId = (commentId: string): string => {
  const id = String(commentId || '').trim();
  if (!id) throw new EngagementError('INVALID_COMMENT', 'Comment id is required');
  return id;
};
