import React from 'react';
import {useState ,useRef ,  useEffect} from "react"
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
            baseColor: 0x383434, 
            THREE: THREE,
            speed: 1.00,
            })
            )
    }
    

return ()=> {
        if(vanta_effect) vanta_effect.destroy();
    }

   }, [])

   // Movie data array
   const movies = [
     { title: 'Barbie', poster: '/assets/barbie-banner.jpg' },
     { title: 'Dune', poster: '/assets/dune-banner.jpg' },
     { title: 'Elemental', poster: '/assets/elemental-banner.jpg' },
     { title: 'Indiana Jones', poster: '/assets/indiana-jones-banner.jpg' },
     { title: 'The Marvels', poster: '/assets/marvels-banner.jpg' },
     { title: 'Mission Impossible 7', poster: '/assets/mi7-banner.jpg' },
     { title: 'Oppenheimer', poster: '/assets/oppenheimer-banner.jpg' },
     { title: 'Spiderman', poster: '/assets/spiderman-banner.jpg' },
     { title: 'Wonka', poster: '/assets/wonka-banner.jpg' }
   ];

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
   <Header/>
   <div className="carousel-bg" ref={vantaRef}>
     <div  className="movie-card-title"> Now Showing </div>
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
       {/* Next Movie */}
       <div className="movie-card-side">
         <img src={getMovie(current+1).poster} alt={getMovie(current+1).title} className="movie-card-img-side" />
         <div style={{ color: '#fff', fontWeight: 500, fontSize: '1rem' }}>{getMovie(current+1).title}</div>
       </div>
     </div>
     {/* Next Button */}
  
   </div>
  <Footer/>   
</div>
   )
}

export default MovieList ;