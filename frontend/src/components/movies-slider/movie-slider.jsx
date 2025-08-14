import {useState} from "react" ; 
import "./movie-slider.css" ;
import { Link } from "react-router-dom";

const MovieSlider = (props)=> {
    const movies = props.movies ; 
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
   
      const getMovie = (idx) => movies[(idx + movies.length) % movies.length];
   

    return (
   
            <div className="carousel-bg">
        <div className="movie-card-title"> Now Showing </div>
        <div className="carousel-row">
       {/* Previous Movie */}
       <div className="movie-card-side">
         <img src={getMovie(current-1)?.poster} alt={getMovie(current-1)?.title} className="movie-card-img-side" width="500" height="750" />
         <div style={{ color: '#fff', fontWeight: 500, fontSize: '1rem' }}>{getMovie(current-1)?.title}</div>
       </div>
       {/* Current Movie */}
       <div className={`movie-card-current${animating ? (direction === 'right' ? ' animating-right' : ' animating-left') : ''}`}>
        
         <img src={getMovie(current)?.poster} alt={getMovie(current)?.title} className="movie-card-img" width="500" height="750" />
         <h2 className="movie-card-h2">{getMovie(current)?.title}</h2>
         <div className="movie-card-controls">
           <button onClick={prevMovie} className="carousel-arrow" style={{ position: 'static' }}>&lt;</button>
           <Link to={`/movie/${getMovie(current)?.id}`} className="movie-selection">Book Now</Link>
           <button onClick={nextMovie} className="carousel-arrow" style={{ position: 'static' }}>&gt;</button>
         </div>
       </div>

       <div className="movie-card-side">
         <img src={getMovie(current+1)?.poster} alt={getMovie(current+1)?.title} className="movie-card-img-side" width="500" height="750" />
         <div style={{ color: '#fff', fontWeight: 500, fontSize: '1rem' }}>{getMovie(current+1)?.title}</div>
       </div>
     </div>
     </div>
    )
}

export default MovieSlider 