import { useState, useRef, useEffect } from "react"
import * as THREE from 'three';
import FOG from 'vanta/dist/vanta.fog.min';
import MovieSelection  from '../../components/movies-selection/movie-selection';
import MovieSlider from '../../components/movies-slider/movie-slider';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import MovieListMobile from './MovieListMobile';

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY; 


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

const localMoviePages = [
  [
    { id: 346698, title: 'Barbie', poster: '/assets/barbie-banner.jpg', rating: 7.2, date: '2025-07-01', genre: 'Comedy' },
    { id: 693134, title: 'Dune', poster: '/assets/dune-banner.jpg', rating: 8.4, date: '2025-07-10', genre: 'Science Fiction' },
    { id: 976573, title: 'Elemental', poster: '/assets/elemental-banner.jpg', rating: 6.9, date: '2025-07-05', genre: 'Animation' },
    { id: 335977, title: 'Indiana Jones', poster: '/assets/indiana-jones-banner.jpg', rating: 7.0, date: '2025-07-03', genre: 'Adventure' },
    { id: 609681, title: 'The Marvels', poster: '/assets/marvels-banner.jpg', rating: 6.5, date: '2025-07-12', genre: 'Action' },
    { id: 575264, title: 'Mission Impossible 7', poster: '/assets/mi7-banner.jpg', rating: 8.1, date: '2025-07-15', genre: 'Action' },
    { id: 872585, title: 'Oppenheimer', poster: '/assets/oppenheimer-banner.jpg', rating: 9.0, date: '2025-07-08', genre: 'Drama' },
    { id: 569094, title: 'Spiderman', poster: '/assets/spiderman-banner.jpg', rating: 7.8, date: '2025-07-02', genre: 'Action' },
    { id: 787699, title: 'Wonka', poster: '/assets/wonka-banner.jpg', rating: 7.3, date: '2025-07-20', genre: 'Family' },
  ],
  [
    { id: 414906, title: 'The Batman', poster: '/assets/OIP.webp', rating: 7.7, date: '2025-07-22', genre: 'Action' },
    { id: 299536, title: 'Avengers: Infinity War', poster: '/assets/marvels-banner.jpg', rating: 8.3, date: '2025-07-24', genre: 'Action' },
    { id: 361743, title: 'Top Gun: Maverick', poster: '/assets/mi7-banner.jpg', rating: 8.2, date: '2025-07-26', genre: 'Action' },
    { id: 447365, title: 'Guardians of the Galaxy Vol. 3', poster: '/assets/marvels-banner.jpg', rating: 7.9, date: '2025-07-28', genre: 'Adventure' },
    { id: 475557, title: 'Joker', poster: '/assets/oppenheimer-banner.jpg', rating: 8.1, date: '2025-07-30', genre: 'Drama' },
    { id: 1022789, title: 'Inside Out 2', poster: '/assets/elemental-banner.jpg', rating: 7.6, date: '2025-08-01', genre: 'Animation' },
    { id: 577922, title: 'Tenet', poster: '/assets/dune-banner.jpg', rating: 7.2, date: '2025-08-03', genre: 'Science Fiction' },
    { id: 634649, title: 'Spider-Man: No Way Home', poster: '/assets/spiderman-banner.jpg', rating: 8.0, date: '2025-08-05', genre: 'Action' },
    { id: 76600, title: 'Avatar: The Way of Water', poster: '/assets/wonka-banner.jpg', rating: 7.6, date: '2025-08-07', genre: 'Adventure' },
  ],
];

const normalizeMovie = (movie) => ({
  ...movie,
  poster: movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : movie.poster || null,
  rating: movie.vote_average ?? movie.rating,
  date: movie.release_date ?? movie.date,
  genre: genresMap[movie.genre_ids?.[0]] || movie.genre || 'Unknown',
});

const getLocalMoviePage = (pageNumber) => localMoviePages[pageNumber - 1] ?? [];

 
const MovieList = () => { 
  const Location =  useLocation() ;
  useEffect(() => {
      window.scrollTo({top:0, left:0, behavior: "smooth"});
  }, [Location.key] );
    
    const { data, isLoading} = useQuery({
      queryKey: ['popularMovies'],
      queryFn: fetchPopularMovies,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
   
    
   
   
    let [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isMobile, setIsMobile] = useState(() =>
      typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth <= 768);
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);
    
    useEffect(() => {
        let initialMovies = (data ?? getLocalMoviePage(1))
            .filter(movie => !movie.adult)
            .map(normalizeMovie);
        setMovies(initialMovies);
    }, [data]);

    const loadMoreMovies = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        const nextPage = page + 1;
        const appendMovies = (newMovies) => {
            if (newMovies.length > 0) {
                setMovies(prevMovies => {
                    const existingIds = new Set(prevMovies.map(movie => String(movie.id)));
                    const uniqueMovies = newMovies.filter(movie => !existingIds.has(String(movie.id)));
                    return [...prevMovies, ...uniqueMovies];
                });
                setPage(nextPage);
                return true;
            }
            setHasMore(false);
            return false;
        };

        try {
            if (!API_KEY) {
                appendMovies(getLocalMoviePage(nextPage).map(normalizeMovie));
                return;
            }

            const { data: nextData } = await axios.get(
`https://api.themoviedb.org/3/discover/movie`,
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
            appendMovies(filteredResults.map(normalizeMovie));
        } catch (error) {
            console.error("Failed to fetch more movies:", error);
            appendMovies(getLocalMoviePage(nextPage).map(normalizeMovie));
        } finally {
            setLoading(false);
        }
    };

    const vantaRef = useRef(null);
    const vantaEffectRef = useRef(null);

   useEffect(() =>{
    if (isMobile) return;
    if (!vantaRef.current || vantaEffectRef.current) return;

    vantaEffectRef.current = FOG({
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
    });

    const resizeObserver = new ResizeObserver(() => {
      if (vantaEffectRef.current?.resize) {
        vantaEffectRef.current.resize();
      }
    });

    resizeObserver.observe(vantaRef.current);

    return () => {
      resizeObserver.disconnect();
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
   }, [isMobile])
   // Movie data array

   if (isMobile) {
    return (
      <div className="mlm-page-bg">
        <div style={{ height: "88px" }}></div>
        <MovieListMobile
          movies={movies}
          loading={isLoading}
          hasMore={hasMore}
          loadingMore={loading}
          onLoadMore={loadMoreMovies}
        />
      </div>
    );
   }

   return (
        <div> 
            <div ref={vantaRef} style={{ width: '100%', minHeight: '100vh' , overflow:"hidden"}} >  
                <div style={{height:"100px"}}></div>
                <MovieSelection movies={movies} loading={isLoading} />
                
                <div style={{ textAlign: 'center', margin: '20px' , display:"flex" , justifyContent:"center"  }}>
                    {hasMore && (
                        <button
                          onClick={loadMoreMovies}
                          disabled={loading}
                          style={{
                            padding: '0.75rem 1.4rem',
                            fontSize: '1rem',
                            minWidth: '9rem',
                            height: '2.75rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(111, 125, 240, 0.45)',
                            background: 'rgba(31, 35, 56, 0.95)',
                            color: '#f5f6ff',
                            fontWeight: 600,
                            boxShadow: '0 6px 16px rgba(16, 19, 42, 0.24)',
                            cursor: loading ? 'not-allowed' : 'pointer',
                          }}
                        >
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
