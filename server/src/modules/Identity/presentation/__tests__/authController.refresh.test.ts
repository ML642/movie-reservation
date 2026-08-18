import { expect, jest, test } from '@jest/globals';
import { asResponse, authenticationResult, createControllerSut, createRequest, createResponse } from './authController.fixtures';

test('rotates the refresh token from its HttpOnly cookie', async () => {
  const { controller, refresh } = createControllerSut();
  const response = createResponse();
  refresh.mockResolvedValue(authenticationResult);
  const request = createRequest();
  request.headers.cookie = 'refreshToken=old-refresh-token';

  await controller.refresh(request, asResponse(response), jest.fn());

  expect(refresh).toHaveBeenCalledWith('old-refresh-token');
  expect(response.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.objectContaining({ httpOnly: true }));
  expect(response.json).toHaveBeenCalledWith({ success: true, token: 'jwt-token', user: authenticationResult.user });
});
