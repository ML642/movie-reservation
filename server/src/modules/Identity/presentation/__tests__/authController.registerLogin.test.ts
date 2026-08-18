import { describe, expect, jest, test } from '@jest/globals';
import { IdentityError } from '../../domain/IdentityError';
import { asResponse, authenticationResult, createControllerSut, createRequest, createResponse } from './authController.fixtures';

describe('authController registration and login', () => {
  test('returns 201 for a successful registration', async () => {
    const { controller, register } = createControllerSut();
    const response = createResponse();
    register.mockResolvedValue(authenticationResult);

    await controller.register(
      createRequest({ username: 'mike', email: 'mike@example.com', password: 'Pass12345!' }),
      asResponse(response),
      jest.fn()
    );

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: 'User registered successfully',
      token: authenticationResult.token,
      user: authenticationResult.user,
    });
  });

  test.each([
    [new IdentityError('MISSING_REQUIRED_FIELDS', 'Missing required fields'), 400],
    [new IdentityError('USER_EXISTS', 'User already exists'), 400],
    [new IdentityError('STORAGE_UNAVAILABLE', 'User storage is temporarily unavailable.'), 503],
  ])('maps registration errors to %i', async (error, status) => {
    const { controller, register } = createControllerSut();
    const response = createResponse();
    register.mockRejectedValue(error);

    await controller.register(createRequest(), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({ success: false, message: error.message });
  });

  test('returns 200 for a successful login', async () => {
    const { controller, login } = createControllerSut();
    const response = createResponse();
    login.mockResolvedValue(authenticationResult);

    await controller.login(createRequest({ email: 'mike@example.com', password: 'Pass12345!' }), asResponse(response), jest.fn());

    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: 'Login successful',
      token: authenticationResult.token,
      user: authenticationResult.user,
    });
  });

  test.each([
    [new IdentityError('MISSING_CREDENTIALS', 'Email/username and password are required'), 400],
    [new IdentityError('INVALID_CREDENTIALS', 'Invalid credentials'), 401],
    [new IdentityError('STORAGE_UNAVAILABLE', 'User storage is temporarily unavailable.'), 503],
  ])('maps login errors to %i', async (error, status) => {
    const { controller, login } = createControllerSut();
    const response = createResponse();
    login.mockRejectedValue(error);

    await controller.login(createRequest(), asResponse(response), jest.fn());

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({ success: false, message: error.message });
  });
});
