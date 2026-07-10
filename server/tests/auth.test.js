const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { getUsernameFromToken } = require('../utils/auth');

const secret = 'backend-test-secret';

test.before(() => {
  process.env.JWT_SECRET = secret;
});

test('returns null when the token is missing', () => {
  assert.equal(getUsernameFromToken(), null);
});

test('returns identity data from a valid token', () => {
  const token = jwt.sign({ username: 'mike', userId: 'user-1' }, secret);
  assert.deepEqual(getUsernameFromToken(token), { username: 'mike', userId: 'user-1' });
});

test('accepts a Bearer-prefixed token', () => {
  const token = jwt.sign({ username: 'anna', userId: 'user-2' }, secret);
  assert.deepEqual(getUsernameFromToken(`Bearer ${token}`), { username: 'anna', userId: 'user-2' });
});

test('returns null for a malformed token', () => {
  assert.equal(getUsernameFromToken('not-a-token'), null);
});

test('returns null for an expired token', () => {
  const token = jwt.sign({ username: 'old', userId: 'user-3', exp: 1 }, secret);
  assert.equal(getUsernameFromToken(token), null);
});

test('rejects a token signed with another secret', () => {
  const token = jwt.sign({ username: 'intruder', userId: 'user-4' }, 'wrong-secret');
  assert.equal(getUsernameFromToken(token), null);
});
