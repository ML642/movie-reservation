import { EngagementService } from './application/EngagementService';
import { MongoEngagementRepository } from './Infrastructure/database/repositories/MongoEngagementRepository';
import type { DatabaseConnection } from './Infrastructure/database/interfaces/DatabaseConnection';
import { CommentModel } from './Infrastructure/database/models/commentModel';
import { LikedMovieModel } from './Infrastructure/database/models/likedMovieModel';
import { createEngagementController } from './presentation/engagementController';
import { createCommentsRoutes, createLikedMoviesRoutes } from './presentation/engagementRoutes';
import type { TokenVerifier } from './presentation/TokenVerifier';

export const createEngagementModule = (tokenProvider: TokenVerifier, databaseConnection: DatabaseConnection) => {
  const repository = new MongoEngagementRepository(LikedMovieModel, CommentModel, databaseConnection);
  const service = new EngagementService(repository);
  const controller = createEngagementController(service);

  return {
    likedMoviesRoutes: createLikedMoviesRoutes(controller, tokenProvider),
    commentsRoutes: createCommentsRoutes(controller, tokenProvider),
  };
};
