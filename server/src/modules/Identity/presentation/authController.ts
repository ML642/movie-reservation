import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { IdentityError } from '../domain/IdentityError';
import type { IdentityService } from '../application/IdentityService';
import type { TokenPayload, TokenProvider } from '../application/ports/TokenProvider';

export interface AuthController {
  register: RequestHandler;
  login: RequestHandler;
  userInfo: RequestHandler;
  changeInfo: RequestHandler;
  testGet: RequestHandler;
}

type AuthenticatedRequest = Request & { user?: TokenPayload };

const getErrorResponse = (error: unknown) => {
  if (!(error instanceof IdentityError)) {
    return { status: 500, message: 'Server error' };
  }

  const statuses: Record<string, number> = {
    MISSING_REQUIRED_FIELDS: 400,
    MISSING_CREDENTIALS: 400,
    NO_PROFILE_CHANGES: 400,
    USER_EXISTS: 400,
    INVALID_CREDENTIALS: 401,
    STORAGE_UNAVAILABLE: 503,
    CONFIGURATION_ERROR: 500,
  };

  return { status: statuses[error.code] || 500, message: error.message };
};

export const createAuthController = (
  identityService: IdentityService,
  tokenProvider: TokenProvider
): AuthController => ({
  register: async (req: Request, res: Response) => {
    try {
      const result = await identityService.register(req.body || {});
      return res.status(201).json({ success: true, message: 'User registered successfully', ...result });
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      return res.status(status).json({ success: false, message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const result = await identityService.login(req.body?.email, req.body?.password);
      return res.json({ success: true, message: 'Login successful', ...result });
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      return res.status(status).json({ success: false, message });
    }
  },

  userInfo: async (req: Request, res: Response) => {
    let tokenIdentity: TokenPayload | null = null;
    const authHeader = req.headers.authorization;

    try {
      if (authHeader?.startsWith('Bearer ')) {
        tokenIdentity = tokenProvider.verify(authHeader.slice(7));
      }
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const bodyUserId = req.body?.userId;
    const userId = tokenIdentity?.userId || bodyUserId;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    if (tokenIdentity?.userId && bodyUserId && tokenIdentity.userId !== bodyUserId) {
      return res.status(403).json({ message: 'Forbidden: user mismatch' });
    }

    try {
      const user = await identityService.findProfileById(userId);
      if (user) return res.json(user);
      if (tokenIdentity && tokenIdentity.userId === userId) {
        return res.json({
          id: tokenIdentity.userId,
          username: tokenIdentity.username || 'User',
          email: tokenIdentity.userEmail || null,
          createdAt: null,
        });
      }
      return res.status(404).json({ message: 'User not found' });
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      return res.status(status).json({ success: false, message });
    }
  },

  changeInfo: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      if (req.body?.userId && req.body.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden: user mismatch' });
      }

      const user = await identityService.updateProfile(userId, req.body || {});
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      if (status === 500) return next(error);
      return res.status(status).json({ success: false, message });
    }
  },

  testGet: (_req: Request, res: Response) => res.json({ success: true, message: 'test' }),
});
