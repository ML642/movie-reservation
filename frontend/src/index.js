// index.js (updated)
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './appStyles';

import reportWebVitals from './reportWebVitals';
import {  createBrowserRouter, RouterProvider } from 'react-router-dom';
import Header from './components/header/header';
import Footer from './components/footer/Footer';
import {QueryClient , QueryClientProvider} from '@tanstack/react-query';
const queryClient = new QueryClient();

const Home = lazy(() => import('./pages/Home/home'));
const Login = lazy(() => import('./pages/Login/login'));
const Signin = lazy(() => import('./pages/Registration/registration'));
const MovieList = lazy(() => import('./pages/movie_list/movies_list'));
const Movie = lazy(() => import('./pages/movie_information/movie'));
const Terms = lazy(() => import('./pages/terms_and_privacy/terms'));
const NotFound = lazy(() => import('./pages/NotFound/notFound'));
const Pricing = lazy(() => import('./pages/pricing/pricing'));
const Profile = lazy(() => import('./pages/Profile/profile'));
const MyReservations = lazy(() => import('./pages/Reservation_info/myReservations'));

const PageFallback = () => (
  <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#fff' }}>
    Loading...
  </div>
);

const Layout = ({ element, fullPage = false }) => {
  if (fullPage) {
    return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
  }

  return (
    <div>
      <Header />
      <Suspense fallback={<PageFallback />}>{element}</Suspense>
      <Footer />

    </div>
  );
}

const router = createBrowserRouter([
 {path: '/', element: <Layout element={ <Home/> } />},
 {path: '/home', element: <Layout element={ <Home/> } />},
 {path: '/login', element: <Layout element={ <Login/> } />},
 {path: '/register', element:<Layout element={ <Signin/> } />},
 {path: '/movie_list' , element : <Layout element={ <MovieList/> } />}, 
 {path: '/movie/:id' , element : <Layout element={ <Movie/> } />}, 
 {path: '/terms' , element : <Layout element={ <Terms/> } />},
 {path: '/pricing' , element : <Layout element={ <Pricing/> } />},
 {path: '/profile' , element : <Layout element={ <Profile/> } />},
 {path: '/my-reservations' , element : <Layout element={ <MyReservations/> } />},
 {path: '*', element : <Layout element={ <NotFound/> } fullPage />}, 
])

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      
       <RouterProvider router={router}/>
       
    </QueryClientProvider>
  </React.StrictMode>
);
reportWebVitals();
