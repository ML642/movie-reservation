import { describe, expect, jest, test } from '@jest/globals';
import { IdentityError } from '../../domain/IdentityError';
import {
  asResponse,
  createControllerSut,
  createRequest,
  createResponse,
  userProfile,
} from './authController.fixtures';

describe('authController userInfo', () => {
  test('returns 401 for an invalid token', async () => {
    const { controller, verify } = createControllerSut();
    const response = createResponse();
    verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await controller.userInfo(createRequest({}, 'Bearer invalid-token'), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  test('returns 400 without an identity', async () => {
    const { controller } = createControllerSut();
    const response = createResponse();

    await controller.userInfo(createRequest(), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'User ID is required' });
  });

  test('returns 403 for mismatched token and body identities', async () => {
    const { controller, verify } = createControllerSut();
    const response = createResponse();
    verify.mockReturnValue({ userId: 'user-1', username: 'mike', userEmail: 'mike@example.com' });

    await controller.userInfo(createRequest({ userId: 'user-2' }, 'Bearer jwt-token'), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(403);
  });

  test('returns the requested profile', async () => {
    const { controller, findProfileById } = createControllerSut();
    const response = createResponse();
    findProfileById.mockResolvedValue(userProfile);

    await controller.userInfo(createRequest({ userId: 'user-1' }), asResponse(response), jest.fn());

    expect(findProfileById).toHaveBeenCalledWith('user-1');
    expect(response.json).toHaveBeenCalledWith(userProfile);
  });

  test('falls back to the verified token identity', async () => {
    const { controller, findProfileById, verify } = createControllerSut();
    const response = createResponse();
    findProfileById.mockResolvedValue(null);
    verify.mockReturnValue({ userId: 'user-1', username: 'mike', userEmail: 'mike@example.com' });

    await controller.userInfo(createRequest({}, 'Bearer jwt-token'), asResponse(response), jest.fn());

    expect(response.json).toHaveBeenCalledWith({ ...userProfile, createdAt: null });
  });

  test.each([
    [null, 404, 'User not found'],
    [new IdentityError('STORAGE_UNAVAILABLE', 'User storage is temporarily unavailable.'), 503, 'User storage is temporarily unavailable.'],
  ])('maps unavailable profile result to %i', async (result, status, message) => {
    const { controller, findProfileById } = createControllerSut();
    const response = createResponse();
    if (result instanceof Error) findProfileById.mockRejectedValue(result);
    else findProfileById.mockResolvedValue(result);

    await controller.userInfo(createRequest({ userId: 'user-1' }), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith(
      status === 404 ? { message } : { success: false, message }
    );
  });
});
