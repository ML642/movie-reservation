import React, { useState, useMemo } from "react" ;
import "./movie-selection.css";
import SkeletonCard from './SkeletonCard';

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
     const [liked, setLiked] = useState([]); // array of liked movie titles
       const [showLikedOnly, setShowLikedOnly] = useState(false); // toggle for showing only liked
       const toggleLike = (title) => {
         setLiked((prev) =>
           prev.includes(title)
             ? prev.filter((t) => t !== title)
             : [...prev, title]
         );
       };
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
    <div className="movie-filter-bar">
        <div className="filter-group" style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search movies by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <span
            className={`heart-toggle${showLikedOnly ? ' liked' : ''}`}
            onClick={toggleShowLiked}
            title={showLikedOnly ? 'Show all movies' : 'Show only liked movies'}
            style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.7rem', cursor: 'pointer', zIndex: 2 }}
          >
            {showLikedOnly ? '❤️' : '🤍'}
          </span>
        </div>
        <div className="filter-group">
          <label htmlFor="genre-select" className="sort-label">Genre:</label>
          <select id="genre-select" value={genre} onChange={e => setGenre(e.target.value)} className="sort-dropdown">
            <option value="all">All</option>
            <option value="Action">Action</option>
            <option value="Comedy">Comedy</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Animation">Animation</option>
            <option value="Adventure">Adventure</option>
            <option value="Drama">Drama</option>
            <option value="Family">Family</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="sort-select" className="sort-label">Sort by:</label>
          <select id="sort-select" value={sort} onChange={e => setSort(e.target.value)} className="sort-dropdown">
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="rating-asc">Rating (Low to High)</option>
            <option value="title-az">Title (A-Z)</option>
            <option value="title-za">Title (Z-A)</option>
          </select>
        </div>
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
                <h3 className="movie-card-h2">{movie?.title}</h3>
                <div style={{ color: '#aaa', fontSize: '0.95rem', margin: '0.5rem 0' }}>Rating: {movie?.rating} | {movie?.date}</div>
                <button className="book-now-btn">Book Now</button>
              </div>
            ))
          )
        )}
      </div>
      </>
      
      )
}

export default React.memo(MovieSelection);