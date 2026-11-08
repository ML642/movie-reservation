import { Link, useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <main className="not-found" aria-labelledby="not-found-title">
      <div className="not-found__content">
        <Link to="/" className="not-found__brand">CineReserve</Link>
        <p className="not-found__code">404</p>
        <h1 id="not-found-title" className="not-found__title">Page not found</h1>
        <p className="not-found__description">
          The link may be outdated, or the page may have moved.
          You can return home or go back to the previous page.
        </p>
        <nav className="not-found__actions" aria-label="Page navigation">
          <Link to="/" className="not-found__home">Back to home</Link>
          <button type="button" onClick={goBack} className="not-found__back">Go back</button>
        </nav>
      </div>
    </main>
  );
};

export default NotFoundPage;
