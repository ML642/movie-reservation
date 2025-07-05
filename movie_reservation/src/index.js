// index.js (updated)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Login from './pages/login';
import Signin from './pages/registration';
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';
import MovieList from "./pages/movies_list";

const router = createBrowserRouter([
 {path: '/', element: <App/>},
 {path: '/home', element: <App/>},
 {path: '/login', element: <Login/>},
 {path: '/register', element: <Signin/>},
 {path: '/movie_list' , element : <MovieList/>}, 
])

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    
    <RouterProvider router={router}/>
   
  </React.StrictMode>
);
reportWebVitals();