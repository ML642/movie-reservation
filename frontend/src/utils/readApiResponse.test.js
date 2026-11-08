import { readApiResponse } from './readApiResponse';

test('reports a plain-text 429 without attempting JSON parsing', async () => {
  const response = { status: 429, ok: false, json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token T')) };
  await expect(readApiResponse(response)).rejects.toMatchObject({ status: 429, message: 'Too many requests. Please wait a minute before trying again.' });
  expect(response.json).not.toHaveBeenCalled();
});

test('handles an HTML error from the hosting proxy without exposing it', async () => {
  const response = { status: 503, ok: false, json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token <')) };
  await expect(readApiResponse(response)).rejects.toThrow('The server is temporarily unavailable.');
});

test('preserves JSON validation errors for the form to display', async () => {
  const payload = { message: 'Invalid credentials' };
  await expect(readApiResponse({ status: 401, ok: false, json: async () => payload })).resolves.toEqual(payload);
});

test('preserves a successful login response', async () => {
  const payload = { token: 'token', user: { username: 'test' } };
  await expect(readApiResponse({ status: 200, ok: true, json: async () => payload })).resolves.toEqual(payload);
});

test.each([null, [], 'unexpected'])('rejects invalid JSON payload shapes: %s', async (payload) => {
  await expect(readApiResponse({ status: 200, ok: true, json: async () => payload })).rejects.toThrow('unexpected response');
});
