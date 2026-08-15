const test = require('node:test');
const assert = require('node:assert/strict');
const { createLikeInput, normalizeMovieKey } = require('../build/Engagement/domain/like');

test('normalizes a title into a movie key', () => {
  const movie = createLikeInput('user-1', { title: 'Dune' });
  assert.equal(movie.movieKey, 'Dune');
  assert.equal(movie.title, 'Dune');
});

test('normalizes movie API field aliases', () => {
  const movie = createLikeInput('user-1', {
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
  assert.throws(() => createLikeInput('user-1', { poster: 'poster.jpg' }), { code: 'INVALID_MOVIE' });
});

test('rejects invalid movie data', () => {
  assert.throws(() => createLikeInput('user-1', {}), { code: 'INVALID_MOVIE' });
});

test('rejects an empty movie key', () => {
  assert.throws(() => normalizeMovieKey('  '), { code: 'INVALID_MOVIE' });
});

