import type { MovieComment } from '../../domain/comment';
import type { LikeInput, LikedMovie } from '../../domain/like';

export interface EngagementRepository {
  listLikesByUserId(userId: string): Promise<LikedMovie[]>;
  saveLike(like: LikeInput): Promise<LikedMovie>;
  removeLike(userId: string, movieKey: string): Promise<boolean>;
  listCommentsByMovieId(movieId: string): Promise<MovieComment[]>;
  createComment(input: Omit<MovieComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<MovieComment>;
  updateCommentText(commentId: string, userId: string, text: string): Promise<MovieComment | null>;
  removeComment(commentId: string, userId: string): Promise<MovieComment | null>;
  commentExists(commentId: string): Promise<boolean>;
}
