import React, { useDeferredValue, useMemo, useState } from "react" ;
import "./movie-selection.css";
import SkeletonCard from './SkeletonCard';
import { Link } from "react-router-dom";
import CustomSelect from "../custom-select/CustomSelect";
import { useLikedMovies } from "../../hooks/useLikedMovies";

const genresMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

const genreOptions = [
  { value: "all", label: "All" },
  { value: "Action", label: "Action" },
  { value: "Comedy", label: "Comedy" },
  { value: "Science Fiction", label: "Science Fiction" },
  { value: "Animation", label: "Animation" },
  { value: "Adventure", label: "Adventure" },
  { value: "Drama", label: "Drama" },
  { value: "Family", label: "Family" },
];

const sortOptions = [
  { value: "date-desc", label: "Newest" },
  { value: "date-asc", label: "Oldest" },
  { value: "rating-desc", label: "Rating (High to Low)" },
  { value: "rating-asc", label: "Rating (Low to High)" },
  { value: "title-az", label: "Title (A-Z)" },
  { value: "title-za", label: "Title (Z-A)" },
];

const getMovieLikeKey = (movie) => String(movie?.movieKey ?? movie?.title ?? movie?.id ?? "");

const matchesGenre = (movie, genre) => {
  if (genre === "all") return true;
  if (movie?.genre === genre) return true;
  return Array.isArray(movie?.genre_ids) && movie.genre_ids.some((id) => genresMap[id] === genre);
};

const MovieSelection = (props) => {
     const { movies, loading } = props; 
     const { liked, notice, toggleLike } = useLikedMovies();
       const [showLikedOnly, setShowLikedOnly] = useState(false); // toggle for showing only liked
       const toggleShowLiked = () => setShowLikedOnly((prev) => !prev);
    
       // Search and sort state
        const [search, setSearch] = useState('');
        const [sort, setSort] = useState('date-desc');
        const [genre, setGenre] = useState('all');
        const deferredSearch = useDeferredValue(search);
         const likedMovieKeys = useMemo(() => new Set(liked), [liked]);

        // Filtered and sorted movies
        const visibleMovies = useMemo(() => {
         const normalizedSearch = deferredSearch.trim().toLowerCase();
         const filteredMovies = movies
           .filter(movie => movie?.title?.toLowerCase().includes(normalizedSearch))
           .filter(movie => matchesGenre(movie, genre));

          const sortedMovies = filteredMovies.sort((a, b) => {
              if (sort === 'rating-desc') return b?.rating - a?.rating;
              if (sort === 'rating-asc') return a?.rating - b?.rating;
              if (sort === 'date-desc') return new Date(b?.date) - new Date(a?.date);
              if (sort === 'date-asc') return new Date(a?.date) - new Date(b?.date);
              if (sort === 'title-az') return a?.title.localeCompare(b?.title);
              if (sort === 'title-za') return b?.title.localeCompare(a?.title);
              return 0;
            });

          return showLikedOnly
            ? sortedMovies.filter((movie) => likedMovieKeys.has(getMovieLikeKey(movie)))
            : sortedMovies;
        }, [movies, deferredSearch, sort, genre, showLikedOnly, likedMovieKeys]);

    return (  <> 
    {notice && (
      <div className="like-notice" role="status" aria-live="polite">
        <strong>{notice.message}</strong>
        <span>{notice.title}</span>
      </div>
    )}
    <div className="movie-filter-bar">
        <div className="filter-group search-group">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search movies by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <button
            type="button"
            className={`heart-toggle${showLikedOnly ? " liked" : ""}`}
            onClick={toggleShowLiked}
            title={showLikedOnly ? "Show all movies" : "Show only liked movies"}
            aria-label={showLikedOnly ? "Show all movies" : "Show only liked movies"}
          >
            {showLikedOnly ? "\u2665" : "\u2661"}
          </button>
        </div>
        <CustomSelect
          id="genre-select"
          className="filter-group"
          label="Genre:"
          value={genre}
          onChange={setGenre}
          options={genreOptions}
        />
        <CustomSelect
          id="sort-select"
          className="filter-group"
          label="Sort by:"
          value={sort}
          onChange={setSort}
          options={sortOptions}
        />
      </div>
      {/* Movie Grid Section */}
      <div className="movie-grid">
        {loading ? (
          Array.from({ length: 12 }).map((_, idx) => <SkeletonCard key={idx} />)
        ) : (
          visibleMovies.length === 0 ? (
            <div className="no-movies-msg">
              <span className="no-movies-icon">🎬</span>
              There is nothing here.
              <div className="no-movies-hint">Try changing your search, filters, or like some movies to see them here!</div>
            </div>
          ) : (
            visibleMovies.map((movie) => (
              <div className="movie-grid-card" key={movie?.id ?? movie?.movieId ?? getMovieLikeKey(movie)}>
                <span
                  className={`heart-icon${likedMovieKeys.has(getMovieLikeKey(movie)) ? ' liked' : ''}`}
                  onClick={() => toggleLike(movie)}
                  title={likedMovieKeys.has(getMovieLikeKey(movie)) ? 'Unlike' : 'Like'}
                >
                  {liked.includes(movie?.title) ? '❤️' : '🤍'}
                </span>
                <img 
                  src={movie?.poster} 
                  alt={movie?.title} 
                  className="movie-card-img" 
                  width="500" 
                  height="750" 
                  loading="lazy"
                  decoding="async"
                />
                <h3 className="movie-grid-title">{movie?.title}</h3>
                <div className="movie-grid-meta">Rating: {movie?.rating} | {movie?.date}</div>
                <Link to={`/movie/${movie?.id}`} className="movie-grid-book-link">
                  <span className="movie-selection">Book Now</span>
                </Link>
              </div>
            ))
          )
        )}
      </div>
      </>
      
      )
}

export default React.memo(MovieSelection);
