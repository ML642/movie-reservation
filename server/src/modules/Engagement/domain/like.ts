import { EngagementError } from './EngagementError';

export interface MovieInput {
  movieKey?: string | number;
  id?: string | number;
  movieId?: string | number;
  title?: string;
  movieName?: string;
  poster?: string;
  moviePoster?: string;
  rating?: unknown;
  vote_average?: unknown;
  date?: string;
  release_date?: string;
  genre?: string;
}

export interface LikeInput {
  userId: string;
  movieKey: string;
  movieId?: string;
  title: string;
  poster?: string;
  rating?: unknown;
  date?: string;
  genre?: string;
}

export interface LikedMovie extends LikeInput {
  createdAt?: Date;
  updatedAt?: Date;
}

export const createLikeInput = (userId: string, movie: MovieInput): LikeInput => {
  const movieKey = String(movie.movieKey || movie.title || movie.id || movie.movieId || '').trim();
  const title = String(movie.title || movie.movieName || movieKey || '').trim();

  if (!userId || !movieKey || !title) {
    throw new EngagementError('INVALID_MOVIE', 'Movie title or id is required');
  }

  return {
    userId: String(userId),
    movieKey,
    movieId: movie.id ? String(movie.id) : movie.movieId ? String(movie.movieId) : undefined,
    title,
    poster: movie.poster || movie.moviePoster || undefined,
    rating: movie.rating ?? movie.vote_average,
    date: movie.date || movie.release_date,
    genre: movie.genre,
  };
};

export const normalizeMovieKey = (movieKey: string): string => {
  const normalizedMovieKey = String(movieKey || '').trim();
  if (!normalizedMovieKey) {
    throw new EngagementError('INVALID_MOVIE', 'Movie key is required');
  }
  return normalizedMovieKey;
};
