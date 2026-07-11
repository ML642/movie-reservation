const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

let serverProcess;
let baseUrl;
const testRunId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

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

const getBookedSeats = async ({ movieId, theaterId, date, time }) => {
  const query = new URLSearchParams({
    movieId: String(movieId),
    theaterId: String(theaterId),
    date,
    time,
  });
  return apiRequest(`/api/reservation/seats?${query.toString()}`);
};

test.before(async () => {
  const port = await getFreePort();
  baseUrl = `http://127.0.0.1:${port}`;

  serverProcess = spawn(process.execPath, ['server.js'], {
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

  const usernameLoginRes = await apiRequest('/api/login', {
    method: 'POST',
    body: { email: payload.username, password: payload.password },
  });
  assert.equal(usernameLoginRes.status, 200);
  assert.equal(usernameLoginRes.json?.success, true);
  assert.ok(usernameLoginRes.json?.token);

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

test('authenticated user can save, list, and remove liked movies', async () => {
  const user = await registerUser();
  const movie = {
    id: `liked-${Date.now()}`,
    title: `Liked Movie ${Date.now()}`,
    poster: 'https://example.com/liked-poster.jpg',
    rating: 8.4,
    date: '2026-07-01',
    genre: 'Drama',
  };

  const createRes = await apiRequest('/api/likes', {
    method: 'POST',
    token: user.token,
    body: { movie },
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.json?.success, true);
  assert.equal(createRes.json?.data?.title, movie.title);

  const listRes = await apiRequest('/api/likes', {
    token: user.token,
  });
  assert.equal(listRes.status, 200);
  assert.equal(listRes.json?.success, true);
  assert.ok(Array.isArray(listRes.json?.data));
  assert.ok(listRes.json.data.some((item) => item.title === movie.title));

  const deleteRes = await apiRequest('/api/likes', {
    method: 'DELETE',
    token: user.token,
    body: { movieKey: movie.title },
  });
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.json?.success, true);

  const listAfterDeleteRes = await apiRequest('/api/likes', {
    token: user.token,
  });
  assert.equal(listAfterDeleteRes.status, 200);
  assert.ok(!listAfterDeleteRes.json.data.some((item) => item.title === movie.title));
});

test('movie comments can be created, edited, listed, and deleted by the owner', async () => {
  const user = await registerUser();
  const movieId = `comments-${testRunId}`;

  const emptyListRes = await apiRequest(`/api/comments/${movieId}`);
  assert.equal(emptyListRes.status, 200);
  assert.equal(emptyListRes.json?.success, true);
  assert.deepEqual(emptyListRes.json?.data, []);

  const unauthCreateRes = await apiRequest(`/api/comments/${movieId}`, {
    method: 'POST',
    body: { text: 'This should not save.' },
  });
  assert.equal(unauthCreateRes.status, 401);

  const createRes = await apiRequest(`/api/comments/${movieId}`, {
    method: 'POST',
    token: user.token,
    body: { text: 'Great pacing and a proper theater movie.' },
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.json?.success, true);
  assert.equal(createRes.json?.data?.movieId, movieId);
  assert.equal(createRes.json?.data?.userId, user.userId);

  const commentId = createRes.json.data.id || createRes.json.data._id;
  assert.ok(commentId);

  const listRes = await apiRequest(`/api/comments/${movieId}`);
  assert.equal(listRes.status, 200);
  assert.ok(listRes.json.data.some((comment) => (comment.id || comment._id) === commentId));

  const updateRes = await apiRequest(`/api/comments/${commentId}`, {
    method: 'PATCH',
    token: user.token,
    body: { text: 'Updated: still a proper theater movie.' },
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.json?.data?.text, 'Updated: still a proper theater movie.');

  const deleteRes = await apiRequest(`/api/comments/${commentId}`, {
    method: 'DELETE',
    token: user.token,
  });
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.json?.success, true);

  const listAfterDeleteRes = await apiRequest(`/api/comments/${movieId}`);
  assert.equal(listAfterDeleteRes.status, 200);
  assert.ok(!listAfterDeleteRes.json.data.some((comment) => (comment.id || comment._id) === commentId));
});

test('users cannot edit or delete another user comment', async () => {
  const owner = await registerUser();
  const attacker = await registerUser();
  const movieId = `comments-forbidden-${testRunId}`;

  const createRes = await apiRequest(`/api/comments/${movieId}`, {
    method: 'POST',
    token: owner.token,
    body: { text: 'Owner-only comment.' },
  });
  assert.equal(createRes.status, 201);

  const commentId = createRes.json.data.id || createRes.json.data._id;
  const forbiddenUpdateRes = await apiRequest(`/api/comments/${commentId}`, {
    method: 'PATCH',
    token: attacker.token,
    body: { text: 'Trying to overwrite this.' },
  });
  assert.equal(forbiddenUpdateRes.status, 403);

  const forbiddenDeleteRes = await apiRequest(`/api/comments/${commentId}`, {
    method: 'DELETE',
    token: attacker.token,
  });
  assert.equal(forbiddenDeleteRes.status, 403);

  const listRes = await apiRequest(`/api/comments/${movieId}`);
  assert.equal(listRes.status, 200);
  assert.ok(listRes.json.data.some((comment) => (comment.id || comment._id) === commentId));
});

test('authenticated user can create, list, and cancel own reservation', async () => {
  const user = await registerUser();
  const movieId = `m-own-${testRunId}`;
  const seatQuery = {
    movieId,
    theaterId: 1,
    date: '2026-02-11',
    time: '7:00 PM',
  };

  const initialSeatsRes = await getBookedSeats(seatQuery);
  assert.equal(initialSeatsRes.status, 200);
  assert.deepEqual(initialSeatsRes.json?.bookedSeats, []);

  const createRes = await createReservation(user.token, {
    movieId,
    seats: ['B2', 'B3'],
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.json?.success, true);
  assert.ok(createRes.json?.data?.id);

  const reservationId = createRes.json.data.id;

  const seatsAfterCreateRes = await getBookedSeats(seatQuery);
  assert.equal(seatsAfterCreateRes.status, 200);
  assert.deepEqual(
    new Set(seatsAfterCreateRes.json?.bookedSeats || []),
    new Set(['B2', 'B3'])
  );

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

  const seatsAfterCancelRes = await getBookedSeats(seatQuery);
  assert.equal(seatsAfterCancelRes.status, 200);
  assert.deepEqual(seatsAfterCancelRes.json?.bookedSeats, []);
});

test('user cannot cancel another user reservation', async () => {
  const owner = await registerUser();
  const attacker = await registerUser();
  const movieId = `m-owner-only-${testRunId}`;

  const createRes = await createReservation(owner.token, {
    movieId,
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

test('reservation booking rejects already-taken seats with 409', async () => {
  const firstUser = await registerUser();
  const secondUser = await registerUser();
  const movieId = `m-conflict-${testRunId}`;

  const firstBooking = await createReservation(firstUser.token, {
    movieId,
    theaterId: 2,
    showtime: '10:00 PM',
    bookingDate: new Date('2026-03-01T12:00:00.000Z').toISOString(),
    seats: ['D4', 'D5'],
  });
  assert.equal(firstBooking.status, 201);

  const conflictBooking = await createReservation(secondUser.token, {
    movieId,
    theaterId: 2,
    showtime: '10:00 PM',
    bookingDate: new Date('2026-03-01T19:30:00.000Z').toISOString(),
    seats: ['D5', 'D6'],
  });
  assert.equal(conflictBooking.status, 409);
  assert.equal(conflictBooking.json?.success, false);
  assert.deepEqual(conflictBooking.json?.conflictingSeats, ['D5']);
});

test('concurrent reservation requests cannot book the same seat twice', async () => {
  const firstUser = await registerUser();
  const secondUser = await registerUser();
  const movieId = `m-concurrent-${testRunId}`;
  const bookingDate = new Date('2026-04-01T18:00:00.000Z').toISOString();

  const [firstBooking, secondBooking] = await Promise.all([
    createReservation(firstUser.token, {
      movieId,
      theaterId: 3,
      showtime: '8:00 PM',
      bookingDate,
      seats: ['E1'],
    }),
    createReservation(secondUser.token, {
      movieId,
      theaterId: 3,
      showtime: '8:00 PM',
      bookingDate,
      seats: ['E1'],
    }),
  ]);

  const statuses = [firstBooking.status, secondBooking.status].sort();
  assert.deepEqual(statuses, [201, 409]);

  const conflictResponse = firstBooking.status === 409 ? firstBooking : secondBooking;
  assert.equal(conflictResponse.json?.success, false);
  assert.deepEqual(conflictResponse.json?.conflictingSeats, ['E1']);
});
