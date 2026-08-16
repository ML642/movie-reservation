import { describe, expect, jest, test } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import type { TokenProvider } from '../../application/ports/TokenProvider';
import { createAuthenticationMiddleware } from '../authRoutes';

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

const createSut = () => {
  const verify = jest.fn<TokenProvider['verify']>();
  const tokenProvider: jest.Mocked<TokenProvider> = {
    issue: jest.fn<TokenProvider['issue']>(),
    verify,
  };
  return { middleware: createAuthenticationMiddleware(tokenProvider), verify };
};

describe('authentication middleware', () => {
  test.each([undefined, 'Basic credentials'])('returns 401 for authorization header %s', (authorization) => {
    const { middleware } = createSut();
    const response = createResponse();
    const request = { headers: authorization ? { authorization } : {} } as unknown as Request;
    const next = jest.fn<NextFunction>();

    middleware(request, response as unknown as Response, next as unknown as NextFunction);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for an invalid Bearer token', () => {
    const { middleware, verify } = createSut();
    const response = createResponse();
    const request = { headers: { authorization: 'Bearer invalid-token' } } as unknown as Request;
    const next = jest.fn<NextFunction>();
    verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    middleware(request, response as unknown as Response, next as unknown as NextFunction);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('adds the verified user and continues', () => {
    const { middleware, verify } = createSut();
    const response = createResponse();
    const request = { headers: { authorization: 'Bearer jwt-token' } } as Request & {
      user?: { userId: string; username: string; userEmail: string };
    };
    const next = jest.fn<NextFunction>();
    verify.mockReturnValue({ userId: 'user-1', username: 'mike', userEmail: 'mike@example.com' });

    middleware(request, response as unknown as Response, next as unknown as NextFunction);

    expect(verify).toHaveBeenCalledWith('jwt-token');
    expect(request.user).toEqual({ userId: 'user-1', username: 'mike', userEmail: 'mike@example.com' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
