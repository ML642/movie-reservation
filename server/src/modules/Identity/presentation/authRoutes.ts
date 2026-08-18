import { Router, type RequestHandler } from 'express';
import type { TokenProvider } from '../application/ports/TokenProvider';
import type { AuthController } from './authController';

export const createAuthenticationMiddleware = (tokenProvider: TokenProvider): RequestHandler => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = tokenProvider.verify(authHeader.slice(7));
    (req as typeof req & { user?: typeof user }).user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const createAuthRoutes = (controller: AuthController, tokenProvider: TokenProvider) => {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(tokenProvider);

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/refresh', controller.refresh);
  router.get('/test', controller.testGet);
  router.post('/userInfo', controller.userInfo);
  router.patch('/changeInfo', authenticate, controller.changeInfo);

  return router;
};
