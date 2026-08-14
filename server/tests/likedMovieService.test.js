const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../services/likedMovieService');

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

test('rejects an empty movie key when removing a like', async () => {
  await assert.rejects(service.removeLikedMovie('user-1', '  '), { code: 'INVALID_MOVIE' });
});

