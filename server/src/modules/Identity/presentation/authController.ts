import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { IdentityError } from '../domain/IdentityError';
import type { IdentityService } from '../application/IdentityService';
import type { TokenPayload, TokenProvider } from '../application/ports/TokenProvider';
import type { OAuthProviderRegistry } from '../application/ports/OAuthProvider';
import { randomBytes, timingSafeEqual } from 'crypto';

export interface AuthController {
  register: RequestHandler;
  login: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  userInfo: RequestHandler;
  changeInfo: RequestHandler;
  testGet: RequestHandler;
  startOAuth: RequestHandler;
  completeOAuth: RequestHandler;
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
  tokenProvider: TokenProvider,
  oauthProviders: OAuthProviderRegistry
): AuthController => ({
  register: async (req: Request, res: Response) => {
    try {
      const result = await identityService.register(req.body || {});
      setRefreshCookie(res, result.refreshToken);
      const { refreshToken: _refreshToken, ...body } = result;
      return res.status(201).json({ success: true, message: 'User registered successfully', ...body });
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      return res.status(status).json({ success: false, message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const result = await identityService.login(req.body?.email, req.body?.password);
      setRefreshCookie(res, result.refreshToken);
      const { refreshToken: _refreshToken, ...body } = result;
      return res.json({ success: true, message: 'Login successful', ...body });
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      return res.status(status).json({ success: false, message });
    }
  },

  refresh: async (req: Request, res: Response) => {
    try {
      const refreshToken = getCookie(req.headers.cookie, 'refreshToken');
      if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token is required' });
      const result = await identityService.refresh(refreshToken);
      setRefreshCookie(res, result.refreshToken);
      return res.json({ success: true, token: result.token, user: result.user });
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      return res.status(status === 500 ? 401 : status).json({ success: false, message });
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const refreshToken = getCookie(req.headers.cookie, 'refreshToken');
      if (refreshToken) await identityService.logout(refreshToken);
      clearRefreshCookie(res);
      return res.status(204).end();
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      clearRefreshCookie(res);
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

  startOAuth: (req: Request, res: Response) => {
    const provider = oauthProviders.get(String(req.params.provider));
    if (!provider) return res.status(404).json({ success: false, message: 'OAuth provider is not supported' });
    try {
      const state = randomBytes(32).toString('hex');
      res.cookie('oauthState', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: `/api/oauth/${provider.name}/callback`, maxAge: 10 * 60 * 1000 });
      return res.redirect(provider.getAuthorizationUrl(state));
    } catch (error) {
      const { status, message } = getErrorResponse(error);
      return res.status(status).json({ success: false, message });
    }
  },

  completeOAuth: async (req: Request, res: Response) => {
    // Render environment variables are often entered with a trailing slash.
    // Appending `/login` directly would then produce `//login`, which React
    // Router treats as a different route and renders the not-found page.
    const configuredFrontendUrl = (process.env.FRONTEND_URL || '').trim();
    const redirectBase = configuredFrontendUrl.replace(/\/+$/, '') || 'http://localhost:3000';
    const providerName = String(req.params.provider);
    const provider = oauthProviders.get(providerName);
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const savedState = getCookie(req.headers.cookie, 'oauthState');
    res.clearCookie('oauthState', { path: `/api/oauth/${providerName}/callback` });
    if (!provider || !savedState || !state || savedState.length !== state.length || !timingSafeEqual(Buffer.from(savedState), Buffer.from(state))) {
      return res.redirect(`${redirectBase}/login?oauth=error&reason=invalid_state`);
    }
    try {
      const result = await identityService.loginWithOAuth(await provider.authenticate(typeof req.query.code === 'string' ? req.query.code : ''));
      setRefreshCookie(res, result.refreshToken);
      return res.redirect(`${redirectBase}/login?oauth=success`);
    } catch (error) {
      const { message } = getErrorResponse(error);
      return res.redirect(`${redirectBase}/login?oauth=error&reason=${encodeURIComponent(message)}`);
    }
  },
});

const getCookie = (header: string | undefined, name: string): string | undefined =>
  header?.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);

const refreshCookieOptions = () => {
  // The frontend and API are separate Render hosts. Treat an HTTPS frontend as
  // a production deployment even if NODE_ENV was not explicitly configured,
  // so browsers can send this cross-site cookie back to /api/refresh.
  const usesSecureCookies = process.env.NODE_ENV === 'production'
    || /^https:\/\//i.test((process.env.FRONTEND_URL || '').trim());
  return {
    httpOnly: true,
    secure: usesSecureCookies,
    sameSite: usesSecureCookies ? 'none' : 'lax',
    path: '/api/refresh',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  } as const;
};

const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie('refreshToken', refreshCookieOptions());
};
