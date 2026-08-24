import { jest } from '@jest/globals';
import type { Request, Response } from 'express';
import type { IdentityService } from '../../application/IdentityService';
import type { TokenProvider } from '../../application/ports/TokenProvider';
import { createAuthController } from '../authController';

export const authenticationResult = {
  token: 'jwt-token',
  refreshToken: 'refresh-token',
  user: { id: 'user-1', username: 'mike', email: 'mike@example.com' },
};

export const userProfile = {
  id: 'user-1',
  username: 'mike',
  email: 'mike@example.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

export type AuthenticatedRequest = Request & { user?: { userId: string } };

export const createRequest = (body: unknown = {}, authorization?: string): Request =>
  ({ body, headers: authorization ? { authorization } : {} }) as unknown as Request;

export const createAuthenticatedRequest = (body: unknown = {}, userId = 'user-1'): AuthenticatedRequest => {
  const request = createRequest(body) as AuthenticatedRequest;
  request.user = { userId };
  return request;
};

export const createResponse = () => {
  const response = { status: jest.fn(), json: jest.fn(), cookie: jest.fn(), clearCookie: jest.fn(), end: jest.fn() };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  response.end.mockReturnValue(response);
  return response;
};

export const createControllerSut = () => {
  const register = jest.fn<IdentityService['register']>();
  const login = jest.fn<IdentityService['login']>();
  const findProfileById = jest.fn<IdentityService['findProfileById']>();
  const updateProfile = jest.fn<IdentityService['updateProfile']>();
  const refresh = jest.fn<IdentityService['refresh']>();
  const logout = jest.fn<IdentityService['logout']>();
  const verify = jest.fn<TokenProvider['verify']>();
  const identityService = { register, login, refresh, logout, findProfileById, updateProfile } as unknown as IdentityService;
  const tokenProvider: jest.Mocked<TokenProvider> = {
    issue: jest.fn<TokenProvider['issue']>(),
    verify,
    issueRefresh: jest.fn<TokenProvider['issueRefresh']>(),
    verifyRefresh: jest.fn<TokenProvider['verifyRefresh']>(),
  };

  return {
    controller: createAuthController(identityService, tokenProvider),
    register,
    login,
    findProfileById,
    updateProfile,
    refresh,
    logout,
    verify,
  };
};

export const asResponse = (response: ReturnType<typeof createResponse>) => response as unknown as Response;
