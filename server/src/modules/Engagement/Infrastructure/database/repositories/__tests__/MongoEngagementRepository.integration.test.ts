import { afterAll, beforeAll, beforeEach, expect, test } from '@jest/globals';
import {
  connectTestDatabase,
  describeWithMongo,
  disconnectTestDatabase,
} from '../../../../../../shared/Infrastructure/database/__tests__/mongoIntegration.fixtures';
import { database } from '../../../../../../shared/Infrastructure/database/MongooseDatabase';
import { CommentModel } from '../../models/commentModel';
import { LikedMovieModel } from '../../models/likedMovieModel';
import { MongoEngagementRepository } from '../MongoEngagementRepository';

const repository = new MongoEngagementRepository(LikedMovieModel, CommentModel, database);

describeWithMongo('MongoEngagementRepository integration', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    await Promise.all([LikedMovieModel.init(), CommentModel.init()]);
  });

  beforeEach(async () => {
    await Promise.all([LikedMovieModel.deleteMany({}), CommentModel.deleteMany({})]);
  });

  afterAll(disconnectTestDatabase);

  test('persists likes and comments in isolated collections', async () => {
    await repository.saveLike({ userId: 'user-1', movieKey: 'movie-1', title: 'Arrival' });
    await repository.createComment({ movieId: 'movie-1', userId: 'user-1', username: 'mike', text: 'Great movie' });

    await expect(repository.listLikesByUserId('user-1')).resolves.toEqual([
      expect.objectContaining({ movieKey: 'movie-1', title: 'Arrival' }),
    ]);
    await expect(repository.listCommentsByMovieId('movie-1')).resolves.toEqual([
      expect.objectContaining({ movieId: 'movie-1', userId: 'user-1', text: 'Great movie' }),
    ]);
  });
});
