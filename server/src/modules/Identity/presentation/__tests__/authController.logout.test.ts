import { expect, test } from '@jest/globals';
import { asResponse, createControllerSut, createRequest, createResponse } from './authController.fixtures';

test('logs out by revoking the refresh session and clearing its cookie', async () => {
  const { controller, logout } = createControllerSut();
  const request = createRequest();
  request.headers.cookie = 'refreshToken=refresh-token';
  const response = createResponse();

  await controller.logout(request, asResponse(response));

  expect(logout).toHaveBeenCalledWith('refresh-token');
  expect(response.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ path: '/api/refresh' }));
  expect(response.status).toHaveBeenCalledWith(204);
  expect(response.end).toHaveBeenCalled();
});
