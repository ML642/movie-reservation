import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaStar } from 'react-icons/fa';
import { useLikedMovies } from '../../hooks/useLikedMovies';
import { isAuthenticated } from '../../utils/jwtDecoder';
import './Favorites.css';

const TMDB_API_KEY = (process.env.REACT_APP_TMDB_API_KEY || '').trim();

const genresMap = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const localMovies = [
  { id: 346698, title: 'Barbie', poster: '/assets/barbie-banner.jpg', rating: 7.2, date: '2025-07-01', genre: 'Comedy' },
  { id: 693134, title: 'Dune', poster: '/assets/dune-banner.jpg', rating: 8.4, date: '2025-07-10', genre: 'Science Fiction' },
  { id: 976573, title: 'Elemental', poster: '/assets/elemental-banner.jpg', rating: 6.9, date: '2025-07-05', genre: 'Animation' },
  { id: 335977, title: 'Indiana Jones', poster: '/assets/indiana-jones-banner.jpg', rating: 7.0, date: '2025-07-03', genre: 'Adventure' },
  { id: 609681, title: 'The Marvels', poster: '/assets/marvels-banner.jpg', rating: 6.5, date: '2025-07-12', genre: 'Action' },
  { id: 575264, title: 'Mission Impossible 7', poster: '/assets/mi7-banner.jpg', rating: 8.1, date: '2025-07-15', genre: 'Action' },
  { id: 872585, title: 'Oppenheimer', poster: '/assets/oppenheimer-banner.jpg', rating: 9.0, date: '2025-07-08', genre: 'Drama' },
  { id: 569094, title: 'Spiderman', poster: '/assets/spiderman-banner.jpg', rating: 7.8, date: '2025-07-02', genre: 'Action' },
  { id: 787699, title: 'Wonka', poster: '/assets/wonka-banner.jpg', rating: 7.3, date: '2025-07-20', genre: 'Family' },
  { id: 414906, title: 'The Batman', poster: '/assets/OIP.webp', rating: 7.7, date: '2025-07-22', genre: 'Action' },
  { id: 299536, title: 'Avengers: Infinity War', poster: '/assets/marvels-banner.jpg', rating: 8.3, date: '2025-07-24', genre: 'Action' },
  { id: 361743, title: 'Top Gun: Maverick', poster: '/assets/mi7-banner.jpg', rating: 8.2, date: '2025-07-26', genre: 'Action' },
  { id: 447365, title: 'Guardians of the Galaxy Vol. 3', poster: '/assets/marvels-banner.jpg', rating: 7.9, date: '2025-07-28', genre: 'Adventure' },
  { id: 475557, title: 'Joker', poster: '/assets/oppenheimer-banner.jpg', rating: 8.1, date: '2025-07-30', genre: 'Drama' },
  { id: 1022789, title: 'Inside Out 2', poster: '/assets/elemental-banner.jpg', rating: 7.6, date: '2025-08-01', genre: 'Animation' },
  { id: 577922, title: 'Tenet', poster: '/assets/dune-banner.jpg', rating: 7.2, date: '2025-08-03', genre: 'Science Fiction' },
  { id: 634649, title: 'Spider-Man: No Way Home', poster: '/assets/spiderman-banner.jpg', rating: 8.0, date: '2025-08-05', genre: 'Action' },
  { id: 76600, title: 'Avatar: The Way of Water', poster: '/assets/wonka-banner.jpg', rating: 7.6, date: '2025-08-07', genre: 'Adventure' },
];

const normalizeTmdbMovie = (movie) => ({
  id: movie.id,
  movieId: String(movie.id),
  movieKey: movie.title,
  title: movie.title,
  poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
  rating: movie.vote_average,
  date: movie.release_date,
  genre: genresMap[movie.genre_ids?.[0]] || 'Unknown',
});

const getMovieKey = (movie) => String(movie?.movieKey || movie?.title || movie?.id || movie?.movieId || '').trim();

const getMovieLookupKeys = (movie) => [
  movie?.movieKey,
  movie?.title,
  movie?.id,
  movie?.movieId,
]
  .filter(Boolean)
  .map((key) => String(key).toLowerCase());

const getCatalogMovie = (movie, catalogByKey) =>
  getMovieLookupKeys(movie)
    .map((key) => catalogByKey.get(key))
    .find(Boolean);

const mergeMovieDetails = (like, catalogByKey) => {
  const key = getMovieKey(like);
  const catalogMovie = getCatalogMovie(like, catalogByKey);

  return {
    ...catalogMovie,
    ...like,
    movieKey: key,
    title: like?.title || catalogMovie?.title || key,
    poster: like?.poster || catalogMovie?.poster,
    movieId: like?.movieId || like?.id || catalogMovie?.movieId || catalogMovie?.id,
    rating: like?.rating ?? catalogMovie?.rating,
    date: like?.date || catalogMovie?.date,
    genre: like?.genre || catalogMovie?.genre,
  };
};

export default function Favorites() {
  const [catalog, setCatalog] = useState(localMovies);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    liked,
    serverLikes,
    isLiked,
    notice,
    toggleLike,
    isSyncing,
    hasLoadedServerLikes,
  } = useLikedMovies();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedCatalogKeys = useRef(new Set());

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.key]);

  useEffect(() => {
    if (!isAuthenticated() || !localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const favoriteSources = useMemo(() => {
    const likesByKey = new Map();

    // Local likes make the UI instant. Server records replace those placeholders
    // when available because they carry poster, rating, and TMDB id metadata.
    liked.forEach((key) => {
      likesByKey.set(key.toLowerCase(), { movieKey: key, title: key });
    });

    serverLikes.forEach((like) => {
      const key = getMovieKey(like);
      if (!key) return;

      const existingLike = likesByKey.get(key.toLowerCase());
      likesByKey.set(key.toLowerCase(), {
        ...existingLike,
        ...like,
        title: like?.title || existingLike?.title || key,
        movieKey: like?.movieKey || existingLike?.movieKey || key,
      });
    });

    return Array.from(likesByKey.values());
  }, [liked, serverLikes]);

  const catalogByKey = useMemo(() => {
    const moviesByKey = new Map();

    catalog.forEach((movie) => {
      getMovieLookupKeys(movie).forEach((key) => moviesByKey.set(key, movie));
    });

    return moviesByKey;
  }, [catalog]);

  const missingCatalogKeys = useMemo(() => {
    const missingKeys = new Set();

    favoriteSources.forEach((like) => {
      const catalogMovie = getCatalogMovie(like, catalogByKey);
      if (!like?.poster && !catalogMovie?.poster) {
        const key = getMovieKey(like);
        if (key) missingKeys.add(key.toLowerCase());
      }
    });

    return Array.from(missingKeys).sort().join('|');
  }, [catalogByKey, favoriteSources]);

  useEffect(() => {
    if (!TMDB_API_KEY || !hasLoadedServerLikes || !missingCatalogKeys) {
      setCatalogLoading(false);
      return undefined;
    }

    if (requestedCatalogKeys.current.has(missingCatalogKeys)) {
      return undefined;
    }

    const requestController = new AbortController();
    let isActive = true;
    setCatalogLoading(true);
    setError('');

    axios.get('https://api.themoviedb.org/3/movie/popular', {
      params: {
        api_key: TMDB_API_KEY,
        include_adult: false,
      },
      signal: requestController.signal,
      timeout: 10000,
    })
      .then(({ data }) => {
        if (!isActive) return;

        const remoteCatalog = (data?.results || [])
          .filter((movie) => !movie.adult)
          .map(normalizeTmdbMovie);
        setCatalog([...localMovies, ...remoteCatalog]);
      })
      .catch((loadError) => {
        if (!isActive || axios.isCancel(loadError) || loadError.code === 'ERR_CANCELED') {
          return;
        }

        console.error('Could not enrich favorite movies:', loadError);
        setError('Could not load additional movie details. Showing saved favorites.');
      })
      .finally(() => {
        if (isActive) {
          requestedCatalogKeys.current.add(missingCatalogKeys);
          setCatalogLoading(false);
        }
      });

    return () => {
      isActive = false;
      requestController.abort();
    };
  }, [hasLoadedServerLikes, missingCatalogKeys]);

  const favoriteMovies = useMemo(() => {
    return favoriteSources
      .map((like) => mergeMovieDetails(like, catalogByKey))
      .filter((movie) => isLiked(movie));
  }, [catalogByKey, favoriteSources, isLiked]);

  const loading = !hasLoadedServerLikes || isSyncing || catalogLoading;

  return (
    <main className="favorites-page">
      {notice && (
        <div className="favorites-notice" role="status" aria-live="polite">
          <strong>{notice.message}</strong>
          <span>{notice.title}</span>
        </div>
      )}

      <section className="favorites-header">
        <div>
          <p className="favorites-kicker">Your Library</p>
          <h1>Favorite Movies</h1>
          <p>Movies you liked are collected here so you can find them fast later.</p>
        </div>
        <div className="favorites-count">
          <FaHeart />
          <span>{favoriteMovies.length}</span>
        </div>
      </section>

      {error && <div className="favorites-error">{error}</div>}

      {loading ? (
        <section className="favorites-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="favorite-card favorite-skeleton" key={index}>
              <div className="favorite-poster-placeholder" />
              <div className="favorite-line" />
              <div className="favorite-line short" />
            </div>
          ))}
        </section>
      ) : favoriteMovies.length === 0 ? (
        <section className="favorites-empty">
          <FaRegHeart />
          <h2>No favorites yet</h2>
          <p>Like movies from the movie list and they will appear here.</p>
          <Link to="/movie_list">Browse Movies</Link>
        </section>
      ) : (
        <section className="favorites-grid">
          {favoriteMovies.map((movie) => (
            <article className="favorite-card" key={movie.movieKey || movie.title}>
              <button
                className="favorite-remove"
                type="button"
                onClick={() => toggleLike(movie)}
                aria-label={`Remove ${movie.title} from favorites`}
                title="Remove from favorites"
              >
                <FaHeart />
              </button>

              {movie.poster ? (
                <img className="favorite-poster" src={movie.poster} alt={movie.title} loading="lazy" />
              ) : (
                <div className="favorite-poster-placeholder">{movie.title?.charAt(0) || '?'}</div>
              )}

              <div className="favorite-body">
                <h2>{movie.title}</h2>
                <div className="favorite-meta">
                  <span>{movie.genre || 'Unknown genre'}</span>
                  <span><FaStar /> {Number.isFinite(Number(movie.rating)) ? Number(movie.rating).toFixed(1) : 'N/A'}</span>
                </div>
                <p>{movie.date || 'Release date unavailable'}</p>
                {movie.movieId ? (
                  <Link to={`/movie/${movie.movieId}`} className="favorite-book">Book Now</Link>
                ) : (
                  <Link to="/movie_list" className="favorite-book">Find Movie</Link>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
