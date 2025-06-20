// index.js (updated)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';


const router = createBrowserRouter([
 {path: '/', element: <App/>},
 {path: '/home', element: <App/>},

])

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    
    <RouterProvider router={router}/>
   
  </React.StrictMode>
);
reportWebVitals();