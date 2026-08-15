import { Router, type RequestHandler } from 'express';
import type { EngagementController } from './engagementController';
import type { TokenVerifier } from './TokenVerifier';

const createAuthenticationMiddleware = (tokenProvider: TokenVerifier): RequestHandler => (request, response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const user = tokenProvider.verify(authorization.slice(7));
    (request as typeof request & { user?: typeof user }).user = user;
    next();
  } catch {
    response.status(401).json({ message: 'Unauthorized' });
  }
};

export const createLikedMoviesRoutes = (controller: EngagementController, tokenProvider: TokenVerifier) => {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(tokenProvider);
  router.use(authenticate);
  router.get('/', controller.listLikes);
  router.post('/', controller.addLike);
  router.delete('/', controller.removeLike);
  router.delete('/:movieKey', controller.removeLike);
  return router;
};

export const createCommentsRoutes = (controller: EngagementController, tokenProvider: TokenVerifier) => {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(tokenProvider);
  router.get('/:movieId', controller.listComments);
  router.post('/:movieId', authenticate, controller.addComment);
  router.patch('/:commentId', authenticate, controller.updateComment);
  router.delete('/:commentId', authenticate, controller.removeComment);
  return router;
};
