import { describe, expect, jest, test } from '@jest/globals';
import { IdentityError } from '../../domain/IdentityError';
import {
  asResponse,
  createAuthenticatedRequest,
  createControllerSut,
  createRequest,
  createResponse,
  userProfile,
} from './authController.fixtures';

describe('authController changeInfo', () => {
  test('returns 401 without an authenticated user', async () => {
    const { controller } = createControllerSut();
    const response = createResponse();

    await controller.changeInfo(createRequest(), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(401);
  });

  test('returns 403 for a mismatched identity', async () => {
    const { controller } = createControllerSut();
    const response = createResponse();

    await controller.changeInfo(createAuthenticatedRequest({ userId: 'user-2' }), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(403);
  });

  test('returns 404 when the profile does not exist', async () => {
    const { controller, updateProfile } = createControllerSut();
    const response = createResponse();
    updateProfile.mockResolvedValue(null);

    await controller.changeInfo(createAuthenticatedRequest({ newName: 'anna' }), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when the service rejects profile changes', async () => {
    const { controller, updateProfile } = createControllerSut();
    const response = createResponse();
    updateProfile.mockRejectedValue(new IdentityError('NO_PROFILE_CHANGES', 'Nothing to update'));

    await controller.changeInfo(createAuthenticatedRequest(), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(400);
  });

  test('returns the updated profile', async () => {
    const { controller, updateProfile } = createControllerSut();
    const response = createResponse();
    updateProfile.mockResolvedValue({ ...userProfile, username: 'anna' });

    await controller.changeInfo(createAuthenticatedRequest({ newName: 'anna' }), asResponse(response), jest.fn());

    expect(updateProfile).toHaveBeenCalledWith('user-1', { newName: 'anna' });
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: 'Profile updated successfully',
      user: { ...userProfile, username: 'anna' },
    });
  });

  test('returns the test endpoint payload', () => {
    const { controller } = createControllerSut();
    const response = createResponse();

    controller.testGet(createRequest(), asResponse(response), jest.fn());

    expect(response.json).toHaveBeenCalledWith({ success: true, message: 'test' });
  });
});
