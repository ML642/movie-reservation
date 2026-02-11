const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

let serverProcess;
let baseUrl;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getFreePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });

const apiRequest = async (pathname, options = {}) => {
  const { method = 'GET', body, token } = options;
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    status: response.status,
    json,
    text,
  };
};

const waitForServer = async (timeoutMs = 15000) => {
  const start = Date.now();
  let lastError;

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await apiRequest('/api/test');
      if (res.status === 200 && res.json?.success === true) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }

  throw new Error(`Server did not become ready in time. Last error: ${lastError?.message || 'none'}`);
};

const stopServer = async () => {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(serverProcess.pid), '/T', '/F']);
    return;
  }

  await new Promise((resolve) => {
    serverProcess.once('exit', () => resolve());
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      if (serverProcess.exitCode === null) {
        serverProcess.kill('SIGKILL');
      }
    }, 2000);
  });
};

const registerUser = async () => {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const payload = {
    username: `user_${suffix}`,
    email: `user_${suffix}@example.com`,
    password: 'Pass12345!',
  };

  const registerRes = await apiRequest('/api/register', {
    method: 'POST',
    body: payload,
  });

  assert.equal(registerRes.status, 201);
  assert.equal(registerRes.json?.success, true);
  assert.ok(registerRes.json?.token);
  assert.equal(registerRes.json?.user?.email, payload.email);

  return {
    ...payload,
    userId: registerRes.json.user.id,
    token: registerRes.json.token,
  };
};

const createReservation = async (token, overrides = {}) => {
  const payload = {
    movieId: 'm-1',
    theaterId: 1,
    seats: ['A1', 'A2'],
    totalPrice: '25.98',
    movieName: 'Inception',
    moviePoster: 'https://example.com/poster.jpg',
    theaterName: 'Cineplex Downtown',
    movieDuration: '148',
    movieGenre: 'Science Fiction',
    showtime: '7:00 PM',
    bookingDate: new Date('2026-02-11T20:00:00.000Z').toISOString(),
    ...overrides,
  };

  return apiRequest('/api/reservation', {
    method: 'POST',
    token,
    body: payload,
  });
};

test.before(async () => {
  const port = await getFreePort();
  baseUrl = `http://127.0.0.1:${port}`;

  serverProcess = spawn(process.execPath, ['app.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      JWT_SECRET: 'test-secret',
    },
    stdio: 'pipe',
  });

  await waitForServer();
});

test.after(async () => {
  await stopServer();
});

test('GET /api/test returns service health payload', async () => {
  const res = await apiRequest('/api/test');
  assert.equal(res.status, 200);
  assert.equal(res.json?.success, true);
  assert.equal(res.json?.message, 'test');
});

test('register/login flow works and duplicate registration is rejected', async () => {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const payload = {
    username: `dup_${suffix}`,
    email: `dup_${suffix}@example.com`,
    password: 'Pass12345!',
  };

  const registerRes = await apiRequest('/api/register', {
    method: 'POST',
    body: payload,
  });
  assert.equal(registerRes.status, 201);
  assert.equal(registerRes.json?.success, true);
  assert.ok(registerRes.json?.token);

  const duplicateRes = await apiRequest('/api/register', {
    method: 'POST',
    body: payload,
  });
  assert.equal(duplicateRes.status, 400);
  assert.equal(duplicateRes.json?.success, false);
  assert.match(duplicateRes.json?.message || '', /already exists/i);

  const loginRes = await apiRequest('/api/login', {
    method: 'POST',
    body: { email: payload.email, password: payload.password },
  });
  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.json?.success, true);
  assert.ok(loginRes.json?.token);

  const badLoginRes = await apiRequest('/api/login', {
    method: 'POST',
    body: { email: payload.email, password: 'wrong-password' },
  });
  assert.equal(badLoginRes.status, 401);
  assert.equal(badLoginRes.json?.success, false);
});

test('POST /api/userInfo enforces token identity and supports token-only lookup', async () => {
  const user = await registerUser();

  const mismatchRes = await apiRequest('/api/userInfo', {
    method: 'POST',
    token: user.token,
    body: { userId: 'some-other-user' },
  });
  assert.equal(mismatchRes.status, 403);
  assert.match(mismatchRes.json?.message || '', /mismatch/i);

  const tokenOnlyRes = await apiRequest('/api/userInfo', {
    method: 'POST',
    token: user.token,
    body: {},
  });
  assert.equal(tokenOnlyRes.status, 200);
  assert.equal(tokenOnlyRes.json?.id, user.userId);
  assert.equal(tokenOnlyRes.json?.email, user.email);
});

test('reservation endpoint requires auth token', async () => {
  const res = await apiRequest('/api/reservation', {
    method: 'POST',
    body: {
      movieId: 'm-unauth',
      theaterId: 1,
      seats: ['A1'],
      totalPrice: '12.99',
      movieName: 'Test',
      moviePoster: 'https://example.com/poster.jpg',
      theaterName: 'Test Theater',
      movieDuration: '100',
      movieGenre: 'Drama',
      showtime: '7:00 PM',
      bookingDate: new Date().toISOString(),
    },
  });

  assert.equal(res.status, 401);
  assert.equal(res.json?.success, false);
});

test('authenticated user can create, list, and cancel own reservation', async () => {
  const user = await registerUser();

  const createRes = await createReservation(user.token, {
    movieId: 'm-own-1',
    seats: ['B2', 'B3'],
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.json?.success, true);
  assert.ok(createRes.json?.data?.id);

  const reservationId = createRes.json.data.id;

  const listRes = await apiRequest('/api/reservation/id', {
    method: 'POST',
    token: user.token,
    body: {},
  });
  assert.equal(listRes.status, 200);
  assert.equal(listRes.json?.success, true);
  assert.ok(Array.isArray(listRes.json?.data));
  assert.ok(listRes.json.data.some((r) => r.id === reservationId));

  const cancelRes = await apiRequest(`/api/reservation/delete/${reservationId}`, {
    method: 'DELETE',
    token: user.token,
  });
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.json?.success, true);
  assert.equal(cancelRes.json?.data?.status, 'cancelled');
});

test('user cannot cancel another user reservation', async () => {
  const owner = await registerUser();
  const attacker = await registerUser();

  const createRes = await createReservation(owner.token, {
    movieId: 'm-owner-only',
    seats: ['C1'],
  });
  assert.equal(createRes.status, 201);
  const reservationId = createRes.json.data.id;

  const forbiddenRes = await apiRequest(`/api/reservation/delete/${reservationId}`, {
    method: 'DELETE',
    token: attacker.token,
  });

  assert.equal(forbiddenRes.status, 403);
  assert.equal(forbiddenRes.json?.success, false);
  assert.match(forbiddenRes.json?.message || '', /forbidden/i);
});
