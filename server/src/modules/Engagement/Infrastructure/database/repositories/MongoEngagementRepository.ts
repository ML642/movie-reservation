import type { Model } from 'mongoose';
import { EngagementError } from '../../../domain/EngagementError';
import type { MovieComment } from '../../../domain/comment';
import type { LikeInput, LikedMovie } from '../../../domain/like';
import type { EngagementRepository } from '../../../application/ports/EngagementRepository';
import type { CommentRecord } from '../interfaces/CommentRecord';
import type { DatabaseConnection } from '../interfaces/DatabaseConnection';
import type { LikedMovieRecord } from '../interfaces/LikedMovieRecord';

export class MongoEngagementRepository implements EngagementRepository {
  constructor(
    private readonly likedMovieModel: Model<LikedMovieRecord>,
    private readonly commentModel: Model<CommentRecord>,
    private readonly connection: DatabaseConnection
  ) {}

  async listLikesByUserId(userId: string): Promise<LikedMovie[]> {
    this.ensureReady('Liked-movie storage is temporarily unavailable.');
    const records = await this.likedMovieModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    return records.map((record) => this.toLikedMovie(record));
  }

  async saveLike(like: LikeInput): Promise<LikedMovie> {
    this.ensureReady('Liked-movie storage is temporarily unavailable.');
    const record = await this.likedMovieModel
      .findOneAndUpdate({ userId: like.userId, movieKey: like.movieKey }, { $set: like }, { new: true, upsert: true, setDefaultsOnInsert: true })
      .lean()
      .exec();
    return this.toLikedMovie(record as LikedMovieRecord);
  }

  async removeLike(userId: string, movieKey: string): Promise<boolean> {
    this.ensureReady('Liked-movie storage is temporarily unavailable.');
    const result = await this.likedMovieModel.deleteOne({ userId, movieKey }).exec();
    return result.deletedCount > 0;
  }

  async listCommentsByMovieId(movieId: string): Promise<MovieComment[]> {
    this.ensureReady('Comment storage is temporarily unavailable.');
    const records = await this.commentModel.find({ movieId }).sort({ createdAt: -1 }).limit(100).lean().exec();
    return records.map((record) => this.toMovieComment(record));
  }

  async createComment(input: Omit<MovieComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<MovieComment> {
    this.ensureReady('Comment storage is temporarily unavailable.');
    const record = await this.commentModel.create(input);
    return this.toMovieComment(record.toObject());
  }

  async updateCommentText(commentId: string, userId: string, text: string): Promise<MovieComment | null> {
    this.ensureReady('Comment storage is temporarily unavailable.');
    try {
      const record = await this.commentModel.findOneAndUpdate({ _id: commentId, userId }, { $set: { text } }, { new: true }).lean().exec();
      return record ? this.toMovieComment(record) : null;
    } catch (error) {
      this.throwInvalidId(error);
    }
  }

  async removeComment(commentId: string, userId: string): Promise<MovieComment | null> {
    this.ensureReady('Comment storage is temporarily unavailable.');
    try {
      const record = await this.commentModel.findOneAndDelete({ _id: commentId, userId }).lean().exec();
      return record ? this.toMovieComment(record) : null;
    } catch (error) {
      this.throwInvalidId(error);
    }
  }

  async commentExists(commentId: string): Promise<boolean> {
    this.ensureReady('Comment storage is temporarily unavailable.');
    try {
      return Boolean(await this.commentModel.exists({ _id: commentId }));
    } catch (error) {
      this.throwInvalidId(error);
    }
  }

  private ensureReady(message: string): void {
    if (!this.connection.isReady()) throw new EngagementError('STORAGE_UNAVAILABLE', message);
  }

  private toLikedMovie(record: LikedMovieRecord): LikedMovie {
    return {
      userId: record.userId,
      movieKey: record.movieKey,
      movieId: record.movieId,
      title: record.title,
      poster: record.poster,
      rating: record.rating,
      date: record.date,
      genre: record.genre,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toMovieComment(record: CommentRecord): MovieComment {
    return {
      id: record.id || String(record._id || ''),
      movieId: record.movieId,
      userId: record.userId,
      username: record.username,
      text: record.text,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private throwInvalidId(error: unknown): never {
    if (error instanceof Error && error.name === 'CastError') {
      throw new EngagementError('INVALID_COMMENT', 'Comment id is required');
    }
    throw error instanceof Error ? error : new Error('Engagement storage operation failed');
  }
}
