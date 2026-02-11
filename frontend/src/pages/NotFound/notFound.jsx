import React, { useEffect, useRef, useState } from 'react';
import './NotFound.css';
  
const VantaNotFoundPage = () => {
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    let isMounted = true;

    const initVanta = async () => {
      try {
        // Load THREE.js
        if (!window.THREE) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Load Vanta NET
        if (!window.VANTA) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.net.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Initialize Vanta effect
        if (isMounted && vantaRef.current && window.VANTA && window.THREE) {
          const effect = window.VANTA.NET({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x9333ea, // Purple
            backgroundColor: 0x0a0a0f, // Very dark
            points: 12.00,
            maxDistance: 23.00,
            spacing: 18.00,
            showDots: true
          });
          
          if (isMounted) {
            vantaEffectRef.current = effect;
            setIsLoaded(true);
          }
        }
      } catch (error) {
        console.error('Failed to load Vanta.js:', error);
        if (isMounted) {
          setIsLoaded(true); // Show content even if Vanta fails
        }
      }
    };

    initVanta();

    return () => {
      isMounted = false;
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
        
        {/* Animated Background Elements */}
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        
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

        {/* Network Status Bar */}
        <div className="status-bar">
          <div className="status-items">
            <div className="status-item">
              <div className="status-dot status-dot-red animate-pulse"></div>
              <span>Network Error</span>
            </div>
            <div className="status-item">
              <div className="status-dot status-dot-orange animate-pulse-delayed-1"></div>
              <span>Status: 404</span>
            </div>
            <div className="status-item">
              <div className="status-dot status-dot-green animate-pulse-delayed-2"></div>
              <span>System Online</span>
            </div>
            <div className="status-item">
              <div className="status-dot status-dot-blue animate-pulse-delayed-3"></div>
              <span>Reconnecting...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Network Icons */}
      <div className="floating-icon floating-icon-1">🔗</div>
      <div className="floating-icon floating-icon-2">📡</div>
      <div className="floating-icon floating-icon-3">🌐</div>
      <div className="floating-icon floating-icon-4">⚡</div>
    </div>
  );
};

export default VantaNotFoundPage;
