import React from 'react';
import { useState, useRef, useEffect } from "react"
import Footer from "../components/Foter/Footer";
import Header from "../components/HEADER1/header";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import FOG from 'vanta/dist/vanta.fog.min';
import './movie_list.css';

import MovieSelection  from '../components/movies-selection/movie-selection';
import MovieSlider from '../components/movies-slider/movie-slider';
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


   return (
<div> 
   <div ref={vantaRef} style={{ width: '100%', minHeight: '100vh' , overflow:"hidden"}} >  
     <div style={{height:"100px"}}></div>
     <MovieSelection movies={movies} ></MovieSelection>
     <MovieSlider movies={movies} ></MovieSlider>
 </div>
</div>
   )
}

export default MovieList ;