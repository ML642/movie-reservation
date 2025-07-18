import React from 'react';
import { useState, useRef, useEffect } from "react"
import Footer from "../components/Foter/Footer";
import Header from "../components/HEADER1/header";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import FOG from 'vanta/dist/vanta.fog.min';
import MovieSelection  from '../components/movies-selection/movie-selection';
import MovieSlider from '../components/movies-slider/movie-slider';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

  const API_KEY = '306506d2d27da7e2c7e566411a66ea35'; 


  const fetchPopularMovies = async () => {
  const { data } = await axios.get(
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&include_adult=false`
  );
  return data.results.filter(movie => !movie.adult);
};
   

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

   let movies_1 = [
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
    
    const { data, isLoading, error } = useQuery({
      queryKey: ['popularMovies'],
      queryFn: fetchPopularMovies,
    });
   
    
   
   
    let [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    useEffect(() => {
        let initialMovies = (data ?? movies_1)
            .filter(movie => !movie.adult) // Explicitly filter out adult movies
            .map(movie => ({
            ...movie,
            poster: movie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null,
            rating: movie.vote_average,
            date: movie.release_date,
            genre: genresMap[movie.genre_ids?.[0]] || 'Unknown'
        }));
        setMovies(initialMovies);
    }, [data]);

    const loadMoreMovies = async () => {
        setLoading(true);
        const nextPage = page + 1;
        try {
            const { data: nextData } = await axios.get(
`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${nextPage}&include_adult=false`,
{ params: {
  api_key: API_KEY,
  sort_by: 'popularity.desc',
  page: nextPage,
  include_adult: false,
  certification_country: 'US',
  certification_lte: 'R', // Only movies rated R or below (no NC-17/adult)
  with_original_language: 'en'
} }           );
            const filteredResults = nextData.results.filter(movie => !movie.adult && movie.title !=="Intimacy");
            const newMovies = filteredResults.map(movie => ({
                ...movie,
                poster: movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null,
                rating: movie.vote_average,
                date: movie.release_date,
                genre: genresMap[movie.genre_ids?.[0]] || 'Unknown'
            }));

            if (newMovies.length > 0) {
                setMovies(prevMovies => [...prevMovies, ...newMovies]);
                setPage(nextPage);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch more movies:", error);
            setHasMore(false);
        }
        setLoading(false);
    };

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
                <MovieSelection movies={movies}></MovieSelection>
                
                <div style={{ textAlign: 'center', margin: '20px' , display:"flex" , justifyContent:"center"  }}>
                    {hasMore && (
                        <button onClick={loadMoreMovies} disabled={loading} style={{ padding: '10px 20px', fontSize: '30px', width:"15rem" , height:"5rem" }}>
                            {loading ? 'Loading...' : 'See More'}
                        </button>
                    )}
                </div>
                <MovieSlider movies={movies}></MovieSlider>
            </div>
        </div>
   )
}

export default MovieList ;