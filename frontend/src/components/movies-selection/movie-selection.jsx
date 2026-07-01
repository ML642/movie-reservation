import React, { useState, useMemo } from "react" ;
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

function GenreFilter (movie,genre){
  if (genre === "all")return movie  ; 
  let flag  = false  ; 
  
  movie.genre_ids.forEach((g) => {
    if (genresMap[g] === genre) {
      flag = true;
    }

  })
  return flag 
}
const MovieSelection = (props) => {
     const { movies, loading } = props; 
     const { liked, notice, toggleLike } = useLikedMovies();
       const [showLikedOnly, setShowLikedOnly] = useState(false); // toggle for showing only liked
       const toggleShowLiked = () => setShowLikedOnly((prev) => !prev);
    
       // Search and sort state
       const [search, setSearch] = useState('');
       const [sort, setSort] = useState('date-desc');
       const [genre, setGenre] = useState('all');
    
       // Filtered and sorted movies
       const filteredMovies = useMemo(() => {
        return movies
          .filter(movie => movie?.title?.toLowerCase().includes(search.toLowerCase()))
          .filter(movie => GenreFilter(movie, genre))
          .sort((a, b) => {
            if (sort === 'rating-desc') return b?.rating - a?.rating;
            if (sort === 'rating-asc') return a?.rating - b?.rating;
            if (sort === 'date-desc') return new Date(b?.date) - new Date(a?.date);
            if (sort === 'date-asc') return new Date(a?.date) - new Date(b?.date);
            if (sort === 'title-az') return a?.title.localeCompare(b?.title);
            if (sort === 'title-za') return b?.title.localeCompare(a?.title);
            return 0;
          });
      }, [movies, search, sort, genre]);

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
          ((showLikedOnly ? filteredMovies.filter(m => liked.includes(m?.title)) : filteredMovies).length === 0) ? (
            <div className="no-movies-msg">
              <span className="no-movies-icon">🎬</span>
              There is nothing here.
              <div className="no-movies-hint">Try changing your search, filters, or like some movies to see them here!</div>
            </div>
          ) : (
            (showLikedOnly ? filteredMovies.filter(m => liked.includes(m?.title)) : filteredMovies).map((movie, idx) => (
              <div className="movie-grid-card" key={idx}>
                <span
                  className={`heart-icon${liked.includes(movie?.title) ? ' liked' : ''}`}
                  onClick={() => toggleLike(movie?.title)}
                  title={liked.includes(movie?.title) ? 'Unlike' : 'Like'}
                >
                  {liked.includes(movie?.title) ? '❤️' : '🤍'}
                </span>
                <img 
                  src={movie?.poster} 
                  alt={movie?.title} 
                  className="movie-card-img" 
                  width="500" 
                  height="750" 
                />
                <h3 className="movie-card-h2" style={{ color: '#aaa', fontSize: '0.95rem', margin: '0.5rem 0' }}>{movie?.title}</h3>
                <div style={{ color: '#aaa', fontSize: '0.95rem', margin: '0.5rem 0' }}>Rating: {movie?.rating} | {movie?.date}</div>
                <Link to={`/movie/${movie?.id}`}>   <div className="movie-selection">Book Now</div></Link>
              </div>
            ))
          )
        )}
      </div>
      </>
      
      )
}

export default React.memo(MovieSelection);
