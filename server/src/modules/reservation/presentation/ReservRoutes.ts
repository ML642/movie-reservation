import { Router, type RequestHandler } from 'express';
import type { ReservationController } from './ReservController';

export interface TokenVerifier {
  verify(token: string): { userId: string; username: string };
}

const authenticate = (tokenVerifier: TokenVerifier): RequestHandler => (request, response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const user = tokenVerifier.verify(authorization.slice(7));
    (request as typeof request & { user?: typeof user }).user = user;
    next();
  } catch {
    response.status(401).json({ message: 'Unauthorized' });
  }
};

export const createReservationRoutes = (controller: ReservationController, tokenVerifier: TokenVerifier) => {
  const router = Router();
  router.get('/seats', controller.getSeats);
  router.use(authenticate(tokenVerifier));
  router.post('/', controller.createReservation);
  router.get('/all', controller.getAllForUser);
  router.post('/id', controller.getByUserId);
  router.delete('/delete/:id', controller.deleteReservation);
  return router;
};
