const http = require('http');
const { afterEach, test } = require('node:test');
const assert = require('node:assert/strict');
const { createGateway } = require('./gateway');

const servers = [];

const listen = (server) => new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => {
    servers.push(server);
    resolve(`http://127.0.0.1:${server.address().port}`);
  });
});

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

test('forwards reservation requests and approved CORS headers', async () => {
  const reservation = http.createServer((req, res) => {
    assert.equal(req.url, '/api/reservation?movieId=42');
    assert.equal(req.method, 'POST');
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: 'reservation-42' }));
  });
  const reservationUrl = await listen(reservation);
  const logs = [];
  const gateway = createGateway({
    targets: [['/api/reservation', reservationUrl], ['/', reservationUrl]],
    allowedOrigins: ['https://frontend.example'],
    logger: { log: (entry) => logs.push(entry) },
  });
  const gatewayUrl = await listen(gateway);

  const response = await fetch(`${gatewayUrl}/api/reservation?movieId=42`, {
    method: 'POST',
    headers: { Origin: 'https://frontend.example' },
  });

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://frontend.example');
  assert.deepEqual(await response.json(), { id: 'reservation-42' });
  assert.equal(logs.length, 0);
});

test('logs upstream connection errors and returns a safe 502 response', async () => {
  const unused = http.createServer();
  const unusedUrl = await listen(unused);
  await new Promise((resolve) => unused.close(resolve));
  servers.splice(servers.indexOf(unused), 1);

  const logs = [];
  const gateway = createGateway({
    targets: [['/api/reservation', unusedUrl], ['/', unusedUrl]],
    logger: { log: (entry) => logs.push(JSON.parse(entry)) },
  });
  const gatewayUrl = await listen(gateway);

  const response = await fetch(`${gatewayUrl}/api/reservation`, { method: 'POST' });

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { success: false, message: 'Service unavailable' });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].event, 'upstream_error');
  assert.equal(logs[0].path, '/api/reservation');
  assert.equal(logs[0].code, 'ECONNREFUSED');
});
