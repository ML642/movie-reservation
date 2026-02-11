import { decodeJWT } from './utils/jwtDecoder';

test('decodeJWT returns null for malformed token', () => {
  expect(decodeJWT('not-a-valid-token')).toBeNull();
});
