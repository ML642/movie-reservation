// index.js (updated)
import React, { Children } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import reportWebVitals from './reportWebVitals';
import Login from './pages/Login/login';
import Signin from './pages/Registration/registration';
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';
import MovieList from "./pages/movie_list/movies_list";
import Header from './components/header/header';
import Footer from './components/footer/Footer';
import {QueryClient , QueryClientProvider} from '@tanstack/react-query';
import Movie from './pages/movie_information/movie';
import Terms from './pages/terms_and_privacy/terms';
import NotFound from './pages/NotFound/notFound';
import Pricing from './pages/pricing/pricing';
import Profile from './pages/Profile/profile';
import MyReservations from './pages/Reservation_info/myReservations';
import Home from './pages/Home/home';  
const queryClient = new QueryClient();

const Layout = (Children) => {
  if (Children.element.type === NotFound) {
    return (<NotFound/>)}
    else {
  return (
    <div>
      <Header />
      {Children.element}
      <Footer />

    </div>
  );}
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
 {path: '*', element : <Layout element={ <NotFound/> } />}, 
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