const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../services/likedMovieService');

test.beforeEach(() => {
  service._internal.memoryLikesByUser.clear();
});

test('normalizes a title into a movie key', () => {
  const movie = service._internal.normalizeMovie({ title: 'Dune' });
  assert.equal(movie.movieKey, 'Dune');
  assert.equal(movie.title, 'Dune');
});

test('normalizes movie API field aliases', () => {
  const movie = service._internal.normalizeMovie({
    id: 12,
    movieName: 'Arrival',
    moviePoster: 'poster.jpg',
    vote_average: 8.1,
    release_date: '2016-11-11',
  });
  assert.equal(movie.movieKey, '12');
  assert.equal(movie.movieId, '12');
  assert.equal(movie.title, 'Arrival');
  assert.equal(movie.poster, 'poster.jpg');
  assert.equal(movie.rating, 8.1);
  assert.equal(movie.date, '2016-11-11');
});

test('rejects normalization without an id or title', () => {
  assert.equal(service._internal.normalizeMovie({ poster: 'poster.jpg' }), null);
});

test('rejects invalid movie data when adding a like', async () => {
  await assert.rejects(service.addLikedMovie('user-1', {}), { code: 'INVALID_MOVIE' });
});

test('stores a valid liked movie for a user', async () => {
  await service.addLikedMovie('user-1', { id: 'movie-1', title: 'Dune' });
  const likes = await service.listLikedMovies('user-1');
  assert.equal(likes.length, 1);
  assert.equal(likes[0].title, 'Dune');
});

test('updates the same liked movie instead of duplicating it', async () => {
  await service.addLikedMovie('user-1', { id: 'movie-1', title: 'Dune', rating: 8 });
  await service.addLikedMovie('user-1', { id: 'movie-1', title: 'Dune', rating: 9 });
  const likes = await service.listLikedMovies('user-1');
  assert.equal(likes.length, 1);
  assert.equal(likes[0].rating, 9);
});

test('isolates liked movies between users', async () => {
  await service.addLikedMovie('user-1', { title: 'Dune' });
  assert.deepEqual(await service.listLikedMovies('user-2'), []);
});

test('rejects an empty movie key when removing a like', async () => {
  await assert.rejects(service.removeLikedMovie('user-1', '  '), { code: 'INVALID_MOVIE' });
});

test('returns true when removing an existing liked movie', async () => {
  await service.addLikedMovie('user-1', { title: 'Dune' });
  assert.equal(await service.removeLikedMovie('user-1', 'Dune'), true);
});

test('returns false when removing a missing liked movie', async () => {
  assert.equal(await service.removeLikedMovie('user-1', 'Missing'), false);
});
