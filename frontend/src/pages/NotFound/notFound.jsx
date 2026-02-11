import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';
import './NotFound.css';
  
const VantaNotFoundPage = () => {
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!vantaRef.current || vantaEffectRef.current) return;

    try {
      vantaEffectRef.current = NET({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x9333ea,
        backgroundColor: 0x0a0a0f,
        points: 12.0,
        maxDistance: 23.0,
        spacing: 18.0,
        showDots: true,
      });
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to initialize Vanta NET effect:', error);
      setIsLoaded(false);
    }

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, []);

  const goHome = () => {

    window.location.href = '/';
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goHome();
    }
  };

  return (
    <div 
      ref={vantaRef}
      className={`not-found-container ${!isLoaded ? 'fallback-bg' : ''}`}
    >
      {/* Overlay for better readability */}
      <div className="overlay"></div>

      {/* Main Content */}
      <div className="main-content">
        
        
        {/* 404 Text */}
        <div className="error-number-container">
          <h1 className="error-number">404</h1>
        </div>

        {/* Title */}
        <h2 className="error-title">
          Lost in the{' '}
          <span className="gradient-text">Network</span>
        </h2>

        {/* Subtitle */}
        <div className="subtitle-container">
          <div className="status-dot status-dot-red"></div>
          <p className="subtitle">
            Connection Lost • Page Not Found
          </p>
          <div className="status-dot status-dot-red"></div>
        </div>

        {/* Description */}
        <p className="description">
          The requested node has been disconnected from the network. You've wandered into uncharted digital territory, 
          but our navigation system can help you find your way back to the main grid.
        </p>

        {/* Buttons */}
        <div className="button-container">
          <button onClick={goHome} className="btn btn-primary">
            <div className="btn-overlay"></div>
            <span className="btn-content">
              <span className="btn-icon">🏠</span>
              <span>Return to Network Hub</span>
            </span>
          </button>
          
          <button onClick={goBack} className="btn btn-secondary">
            <span className="btn-content">
              <span className="btn-icon">↶</span>
              <span>Previous Node</span>
            </span>
          </button>
        </div>

        
        </div>
      </div>

  );
};

export default VantaNotFoundPage;
