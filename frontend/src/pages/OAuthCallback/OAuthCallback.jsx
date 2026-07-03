import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const username = params.get('username');
    const email = params.get('email');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('token', token);
      if (username) localStorage.setItem('username', username);
      if (email) localStorage.setItem('userEmail', email);
      navigate('/movie_list', { replace: true });
      return;
    }

    if (!error) {
      navigate('/login', {
        replace: true,
        state: {
          notice: {
            type: 'error',
            title: 'OAuth failed',
            message: 'The provider did not return a valid login response.',
          },
        },
      });
    }
  }, [location.search, navigate]);

  const error = new URLSearchParams(location.search).get('error');

  if (error) {
    return (
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#fff', padding: '2rem' }}>
        <section style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1>OAuth sign in failed</h1>
          <p>{error}</p>
          <Link to="/login">Back to login</Link>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#fff' }}>
      Signing you in...
    </main>
  );
}
