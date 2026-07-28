const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

const withServer = async (callback) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
};

test('returns a JSON 404 response for unknown routes', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/missing`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { success: false, message: 'Route not found' });
  });
});

test('returns a lightweight health payload', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.mongo?.ready, 'boolean');
    assert.equal(typeof body.mongo?.state, 'string');
  });
});

test('rejects disallowed browser origins with JSON', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/test`, {
      headers: { Origin: 'https://untrusted.example' },
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { success: false, message: 'Not allowed by CORS' });
  });
});

test('caches allowed CORS preflight requests', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/likes`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-max-age'), '7200');
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  });
});
