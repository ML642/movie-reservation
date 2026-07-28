// index.js (updated)
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import reportWebVitals from './reportWebVitals';
import {  createBrowserRouter, RouterProvider } from 'react-router-dom';
import Header from './components/header/header';
import Footer from './components/footer/Footer';
import {QueryClient , QueryClientProvider} from '@tanstack/react-query';
import Home from './pages/Home/home';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = error?.response?.status;

        // Bad requests (including a missing/invalid API key) cannot succeed on
        // retry. Transient failures receive one retry instead of React Query's
        // default three retries.
        if (status && status < 500 && status !== 429) {
          return false;
        }

        return failureCount < 1;
      },
    },
  },
});

const Login = lazy(() => import('./pages/Login/login'));
const Signin = lazy(() => import('./pages/Registration/registration'));
const MovieList = lazy(() => import('./pages/movie_list/movies_list'));
const Movie = lazy(() => import('./pages/movie_information/movie'));
const Terms = lazy(() => import('./pages/terms_and_privacy/terms'));
const NotFound = lazy(() => import('./pages/NotFound/notFound'));
const Pricing = lazy(() => import('./pages/pricing/pricing'));
const Profile = lazy(() => import('./pages/Profile/profile'));
const MyReservations = lazy(() => import('./pages/Reservation_info/myReservations'));
const Favorites = lazy(() => import('./pages/Favorites/Favorites'));
const Theaters = lazy(() => import('./pages/Theaters/theaters'));

const PageFallback = () => (
  <div className="page-fallback">
    Loading...
  </div>
);

const Layout = ({ element, fullPage = false }) => {
  if (fullPage) {
    return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header />
      <div id="main-content" tabIndex="-1">
        <Suspense fallback={<PageFallback />}>{element}</Suspense>
      </div>
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
 {path: '/favorites' , element : <Layout element={ <Favorites/> } />},
 {path: '/theaters' , element : <Layout element={ <Theaters/> } />},
 {path: '*', element : <Layout element={ <NotFound/> } fullPage />}, 
])

const root = ReactDOM.createRoot(document.getElementById('root'));

const WEB_VITALS_ENDPOINT = (process.env.REACT_APP_WEB_VITALS_ENDPOINT || '').trim();

const sendWebVital = (metric) => {
  if (typeof window === 'undefined') return;

  const payload = {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    rating: metric.rating,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  };

  // This makes metrics available to an analytics integration without exposing
  // the PerformanceEntry target or other user-specific data.
  window.dispatchEvent(new CustomEvent('web-vital', { detail: payload }));

  if (!WEB_VITALS_ENDPOINT) return;

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon && navigator.sendBeacon(
      WEB_VITALS_ENDPOINT,
      new Blob([body], { type: 'application/json' })
    )) {
    return;
  }

  fetch(WEB_VITALS_ENDPOINT, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => {});
};

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      
       <RouterProvider router={router}/>
       
    </QueryClientProvider>
  </React.StrictMode>
);
reportWebVitals(sendWebVital);
