import { describe, expect, jest, test } from '@jest/globals';
import { EngagementService } from '../EngagementService';
import type { EngagementRepository } from '../ports/EngagementRepository';

const createRepository = (): jest.Mocked<EngagementRepository> => ({
  listLikesByUserId: jest.fn<EngagementRepository['listLikesByUserId']>(),
  saveLike: jest.fn<EngagementRepository['saveLike']>(),
  removeLike: jest.fn<EngagementRepository['removeLike']>(),
  listCommentsByMovieId: jest.fn<EngagementRepository['listCommentsByMovieId']>(),
  createComment: jest.fn<EngagementRepository['createComment']>(),
  updateCommentText: jest.fn<EngagementRepository['updateCommentText']>(),
  removeComment: jest.fn<EngagementRepository['removeComment']>(),
  commentExists: jest.fn<EngagementRepository['commentExists']>(),
});

describe('EngagementService', () => {
  test('normalizes a liked movie before saving it', async () => {
    const repository = createRepository();
    const service = new EngagementService(repository);
    repository.saveLike.mockImplementation(async (like) => like);

    await service.addLike('user-1', {
      id: 12,
      movieName: 'Arrival',
      moviePoster: 'poster.jpg',
      vote_average: 8.1,
      release_date: '2016-11-11',
    });

    expect(repository.saveLike).toHaveBeenCalledWith({
      userId: 'user-1',
      movieKey: '12',
      movieId: '12',
      title: 'Arrival',
      poster: 'poster.jpg',
      rating: 8.1,
      date: '2016-11-11',
      genre: undefined,
    });
  });

  test('rejects an update by a non-owner', async () => {
    const repository = createRepository();
    const service = new EngagementService(repository);
    repository.updateCommentText.mockResolvedValue(null);
    repository.commentExists.mockResolvedValue(true);

    await expect(service.updateComment('comment-1', 'user-2', 'Updated text')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  test('returns null when the removed comment no longer exists', async () => {
    const repository = createRepository();
    const service = new EngagementService(repository);
    repository.removeComment.mockResolvedValue(null);
    repository.commentExists.mockResolvedValue(false);

    await expect(service.removeComment('comment-1', 'user-1')).resolves.toBeNull();
  });
});
