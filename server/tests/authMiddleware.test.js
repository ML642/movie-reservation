const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleWare/authMiddleware');

const secret = 'middleware-test-secret';

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test.before(() => {
  process.env.JWT_SECRET = secret;
});

test('rejects a request without authorization', () => {
  const res = createResponse();
  let nextCalled = false;
  authMiddleware({ headers: {} }, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(nextCalled, false);
});

test('rejects a non-Bearer authorization value', () => {
  const res = createResponse();
  authMiddleware({ headers: { authorization: 'Basic credentials' } }, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('rejects an invalid Bearer token', () => {
  const res = createResponse();
  authMiddleware({ headers: { authorization: 'Bearer invalid' } }, res, () => {});
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /invalid or expired/i);
});

test('attaches the user and continues for a valid token', () => {
  const token = jwt.sign({ username: 'mike', userId: 'user-7' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalls = 0;
  authMiddleware(req, res, () => { nextCalls += 1; });
  assert.deepEqual(req.user, { username: 'mike', userId: 'user-7' });
  assert.equal(nextCalls, 1);
  assert.equal(res.body, undefined);
});
