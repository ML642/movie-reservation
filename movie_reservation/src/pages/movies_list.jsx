import React from 'react';
import { useState, useRef, useEffect } from "react"
import Footer from "../components/Foter/Footer";
import Header from "../components/HEADER1/header";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import FOG from 'vanta/dist/vanta.fog.min';
import './movie_list.css';



const MovieList = () => { 
    const vantaRef = useRef(null);
    const [vanta_effect, setVantaEffect] = useState(null);

   useEffect(() =>{
    if(!vanta_effect && vantaRef.current){
        setVantaEffect(
            FOG({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            highlightColor: 0x0,
            midtoneColor: 0x655755,
            lowlightColor: 0x31198b,
            baseColor: 0x583434, 
            THREE: THREE,
            speed: 1.00,
            })
            )
    }
    

return ()=> {
        if(vanta_effect) vanta_effect.destroy();
    }
   }, [])
useEffect(() => {
  if (!vantaRef.current) return;

  const resizeObserver = new ResizeObserver(() => {
    if (vanta_effect?.resize) {
      vanta_effect.resize();
      console.log("Vanta effect resized");
    }
  });

  resizeObserver.observe(vantaRef.current);

  return () => {
    resizeObserver.disconnect(); // cleanup on unmount
  };
}, [vanta_effect]);
   // Movie data array
   const movies = [
     { title: 'Barbie', poster: '/assets/barbie-banner.jpg', rating: 7.2, date: '2025-07-01', genre: 'Comedy' },
     { title: 'Dune', poster: '/assets/dune-banner.jpg', rating: 8.4, date: '2025-07-10', genre: 'Sci-Fi' },
     { title: 'Elemental', poster: '/assets/elemental-banner.jpg', rating: 6.9, date: '2025-07-05', genre: 'Animation' },
     { title: 'Indiana Jones', poster: '/assets/indiana-jones-banner.jpg', rating: 7.0, date: '2025-07-03', genre: 'Adventure' },
     { title: 'The Marvels', poster: '/assets/marvels-banner.jpg', rating: 6.5, date: '2025-07-12', genre: 'Action' },
     { title: 'Mission Impossible 7', poster: '/assets/mi7-banner.jpg', rating: 8.1, date: '2025-07-15', genre: 'Action' },
     { title: 'Oppenheimer', poster: '/assets/oppenheimer-banner.jpg', rating: 9.0, date: '2025-07-08', genre: 'Drama' },
     { title: 'Spiderman', poster: '/assets/spiderman-banner.jpg', rating: 7.8, date: '2025-07-02', genre: 'Action' },
     { title: 'Wonka', poster: '/assets/wonka-banner.jpg', rating: 7.3, date: '2025-07-20', genre: 'Family' }
   ];

   // Like state
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
   const filteredMovies = movies
     .filter(movie => movie.title.toLowerCase().includes(search.toLowerCase()))
     .filter(movie => genre === 'all' ? true : movie.genre === genre)
     .sort((a, b) => {
       if (sort === 'rating-desc') return b.rating - a.rating;
       if (sort === 'rating-asc') return a.rating - b.rating;
       if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
       if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
       if (sort === 'title-az') return a.title.localeCompare(b.title);
       if (sort === 'title-za') return b.title.localeCompare(a.title);
       return 0;
     });

   const [current, setCurrent] = useState(0);
   const [animating, setAnimating] = useState(false);
   const [direction, setDirection] = useState('right'); // 'left' or 'right'
   const prevMovie = () => {
     setDirection('left');
     setAnimating(true);
     setTimeout(() => {
       setCurrent((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
       setAnimating(false);
     }, 250);
   };
   const nextMovie = () => {
     setDirection('right');
     setAnimating(true);
     setTimeout(() => {
       setCurrent((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
       setAnimating(false);
     }, 250);
   };

   // Helper to get movie index with wrap-around
   const getMovie = (idx) => movies[(idx + movies.length) % movies.length];

   return (
<div> 
   <div ref={vantaRef} style={{ width: '100%', minHeight: '100vh' , overflow:"hidden"}} >  
     <div style={{height:"100px"}}></div>
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
        {((showLikedOnly ? filteredMovies.filter(m => liked.includes(m.title)) : filteredMovies).length === 0) ? (
          <div className="no-movies-msg">
            <span className="no-movies-icon">🎬</span>
            There is nothing here.
            <div className="no-movies-hint">Try changing your search, filters, or like some movies to see them here!</div>
          </div>
        ) : (
          (showLikedOnly ? filteredMovies.filter(m => liked.includes(m.title)) : filteredMovies).map((movie, idx) => (
            <div className="movie-grid-card" key={idx}>
              <span
                className={`heart-icon${liked.includes(movie.title) ? ' liked' : ''}`}
                onClick={() => toggleLike(movie.title)}
                title={liked.includes(movie.title) ? 'Unlike' : 'Like'}
              >
                {liked.includes(movie.title) ? '❤️' : '🤍'}
              </span>
              <img src={movie.poster} alt={movie.title} className="movie-card-img" />
              <h3 className="movie-card-h2">{movie.title}</h3>
              <div style={{ color: '#aaa', fontSize: '0.95rem', margin: '0.5rem 0' }}>Rating: {movie.rating} | {movie.date}</div>
              <button className="book-now-btn">Book Now</button>
            </div>
          ))
        )}
      </div>
      
      <div className="carousel-bg">
        <div className="movie-card-title"> Now Showing </div>
        <div className="carousel-row">
       {/* Previous Movie */}
       <div className="movie-card-side">
         <img src={getMovie(current-1).poster} alt={getMovie(current-1).title} className="movie-card-img-side" />
         <div style={{ color: '#fff', fontWeight: 500, fontSize: '1rem' }}>{getMovie(current-1).title}</div>
       </div>
       {/* Current Movie */}
       <div className={`movie-card-current${animating ? (direction === 'right' ? ' animating-right' : ' animating-left') : ''}`}>
        
         <img src={getMovie(current).poster} alt={getMovie(current).title} className="movie-card-img" />
         <h2 className="movie-card-h2">{getMovie(current).title}</h2>
         <div className="movie-card-controls">
           <button onClick={prevMovie} className="carousel-arrow" style={{ position: 'static' }}>&lt;</button>
           <button className="book-now-btn">Book Now</button>
           <button onClick={nextMovie} className="carousel-arrow" style={{ position: 'static' }}>&gt;</button>
         </div>
       </div>

       <div className="movie-card-side">
         <img src={getMovie(current+1).poster} alt={getMovie(current+1).title} className="movie-card-img-side" />
         <div style={{ color: '#fff', fontWeight: 500, fontSize: '1rem' }}>{getMovie(current+1).title}</div>
       </div>
     </div>
  
   </div> </div>

</div>
   )
}

export default MovieList ;