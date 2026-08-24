import { afterEach, describe, expect, jest, test } from '@jest/globals';
import type { Request, Response } from 'express';
import type { IdentityService } from '../../application/IdentityService';
import type { OAuthProviderRegistry } from '../../application/ports/OAuthProvider';
import type { TokenProvider } from '../../application/ports/TokenProvider';
import { createAuthController } from '../authController';

const originalFrontendUrl = process.env.FRONTEND_URL;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
  else process.env.FRONTEND_URL = originalFrontendUrl;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

test('OAuth callback removes a trailing slash from FRONTEND_URL', async () => {
  process.env.FRONTEND_URL = 'https://movie-reservation-1-4uao.onrender.com/';
  delete process.env.NODE_ENV;
  const loginWithOAuth = jest.fn<IdentityService['loginWithOAuth']>().mockResolvedValue({
    token: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 'user-1', username: 'mike', email: 'mike@example.com' },
  });
  const identityService = { loginWithOAuth } as unknown as IdentityService;
  const tokenProvider = {} as TokenProvider;
  const oauthProviders = {
    get: jest.fn().mockReturnValue({
      name: 'google',
      authenticate: jest.fn().mockResolvedValue({
        provider: 'google', subject: 'google-user-1', username: 'mike', email: 'mike@example.com',
      }),
    }),
  } as unknown as OAuthProviderRegistry;
  const controller = createAuthController(identityService, tokenProvider, oauthProviders);
  const response = {
    clearCookie: jest.fn(),
    cookie: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response;
  const request = {
    params: { provider: 'google' },
    query: { state: 'matching-state', code: 'authorization-code' },
    headers: { cookie: 'oauthState=matching-state' },
  } as unknown as Request;

  await controller.completeOAuth(request, response);

  expect(response.redirect).toHaveBeenCalledWith(
    'https://movie-reservation-1-4uao.onrender.com/login?oauth=success'
  );
  expect(response.cookie).toHaveBeenCalledWith(
    'refreshToken',
    'refresh-token',
    expect.objectContaining({ secure: true, sameSite: 'none', path: '/api/refresh' })
  );
});
