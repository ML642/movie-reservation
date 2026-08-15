import { EngagementError } from '../domain/EngagementError';
import {
  createCommentChange,
  createCommentInput,
  normalizeCommentId,
  normalizeMovieId,
  type CommentInput,
  type MovieComment,
} from '../domain/comment';
import { createLikeInput, normalizeMovieKey, type LikedMovie, type MovieInput } from '../domain/like';
import type { EngagementRepository } from './ports/EngagementRepository';

export class EngagementService {
  constructor(private readonly repository: EngagementRepository) {}

  listLikes(userId: string): Promise<LikedMovie[]> {
    return this.repository.listLikesByUserId(String(userId || ''));
  }

  addLike(userId: string, movie: MovieInput): Promise<LikedMovie> {
    return this.repository.saveLike(createLikeInput(userId, movie));
  }

  removeLike(userId: string, movieKey: string): Promise<boolean> {
    return this.repository.removeLike(String(userId || ''), normalizeMovieKey(movieKey));
  }

  async listComments(movieId: string): Promise<MovieComment[]> {
    return this.repository.listCommentsByMovieId(normalizeMovieIdOrThrow(movieId));
  }

  createComment(input: CommentInput): Promise<MovieComment> {
    return this.repository.createComment(createCommentInput(input));
  }

  async updateComment(commentId: string, userId: string, text: string): Promise<MovieComment | null> {
    const updatedComment = await this.repository.updateCommentText(
      normalizeCommentId(commentId),
      String(userId || ''),
      createCommentChange(text).text
    );

    if (updatedComment || !(await this.repository.commentExists(normalizeCommentId(commentId)))) {
      return updatedComment;
    }

    throw new EngagementError('FORBIDDEN', 'Forbidden: not your comment');
  }

  async removeComment(commentId: string, userId: string): Promise<MovieComment | null> {
    const id = normalizeCommentId(commentId);
    const removedComment = await this.repository.removeComment(id, String(userId || ''));

    if (removedComment || !(await this.repository.commentExists(id))) {
      return removedComment;
    }

    throw new EngagementError('FORBIDDEN', 'Forbidden: not your comment');
  }
}

const normalizeMovieIdOrThrow = (movieId: string): string => {
  const normalizedMovieId = normalizeMovieId(movieId);
  if (!normalizedMovieId) {
    throw new EngagementError('INVALID_COMMENT', 'Movie id is required');
  }
  return normalizedMovieId;
};
