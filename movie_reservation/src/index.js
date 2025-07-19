// index.js (updated)
import React, { Children } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Login from './pages/login';
import Signin from './pages/registration';
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';
import MovieList from "./pages/movies_list";
import Header from './components/HEADER1/header';
import Footer from './components/Foter/Footer';
import {QueryClient , QueryClientProvider} from '@tanstack/react-query';
import Movie from './pages/movie';
const queryClient = new QueryClient();

const Layout = (Children) => {
  return (
    <div>
      <Header />
      {Children.element}
      <Footer />

    </div>
  );
}

const router = createBrowserRouter([
 {path: '/', element: <Layout element={ <App/> } />},
 {path: '/home', element: <Layout element={ <App/> } />},
 {path: '/login', element: <Layout element={ <Login/> } />},
 {path: '/register', element:<Layout element={ <Signin/> } />},
 {path: '/movie_list' , element : <Layout element={ <MovieList/> } />}, 
 {path: '/movie/:id' , element : <Layout element={ <Movie/> } />}, 
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