import {
  decodeJWT,
  getUserFromToken,
  isAuthenticated,
  getTokenExpiration,
  isTokenExpiringSoon,
} from './jwtDecoder';

const makeToken = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe('jwtDecoder utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('decodeJWT parses valid token payload', () => {
    const token = makeToken({ userId: '123', username: 'test-user' });
    expect(decodeJWT(token)).toEqual(
      expect.objectContaining({ userId: '123', username: 'test-user' })
    );
  });

  test('getUserFromToken returns mapped user data for valid token', () => {
    const token = makeToken({
      userId: 'u-1',
      username: 'mike',
      userEmail: 'mike@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem('token', token);

    const user = getUserFromToken();
    expect(user).toEqual(
      expect.objectContaining({
        id: 'u-1',
        name: 'mike',
        email: 'mike@example.com',
      })
    );
    expect(isAuthenticated()).toBe(true);
  });

  test('expired token is rejected and removed from storage', () => {
    const expired = makeToken({
      userId: 'u-2',
      username: 'old-user',
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    localStorage.setItem('token', expired);

    expect(getUserFromToken()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  test('token expiration helpers return expected values', () => {
    const exp = Math.floor(Date.now() / 1000) + 30 * 60;
    const token = makeToken({ userId: 'u-3', exp });
    localStorage.setItem('token', token);

    const expirationDate = getTokenExpiration();
    expect(expirationDate).toBeInstanceOf(Date);
    expect(isTokenExpiringSoon()).toBe(true);
  });
});
