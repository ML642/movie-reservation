import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { HttpOAuthProvider } from '../HttpOAuthProvider';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('HttpOAuthProvider', () => {
  test('sends Google the required authorization-code grant type', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'google-access-token' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: 'google-user-1', email: 'mike@example.com', email_verified: true, name: 'Mike' }),
      });
    global.fetch = fetchMock as typeof fetch;
    const provider = new HttpOAuthProvider('google', {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.com/api/oauth/google/callback',
    });

    await provider.authenticate('authorization-code');

    const tokenRequest = fetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchMock.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
    expect(String(tokenRequest.body)).toContain('grant_type=authorization_code');
  });
});
