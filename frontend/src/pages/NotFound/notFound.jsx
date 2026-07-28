import './NotFound.css';
  
const NotFoundPage = () => {
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
    <div className="not-found-container fallback-bg">
      {/* Overlay for better readability */}
      <div className="overlay"></div>

      {/* Main Content */}
      <div className="main-content">
        
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

export default NotFoundPage;
