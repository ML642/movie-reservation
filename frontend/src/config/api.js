const trimTrailingSlash = (value) => value.replace(/\/+$/, '');
const RENDER_API_BY_FRONTEND_HOST = {
  'movie-reservation-1.onrender.com': 'https://movie-reservation-z2nv.onrender.com',
  // The second Render frontend is served independently of the API. Without this
  // mapping it falls back to its own SPA origin, turning `/api/*` into a 404.
  'movie-reservation-1-4uao.onrender.com': 'https://movie-reservation-z2nv.onrender.com',
};

const resolveApiBaseUrl = () => {
  const envValue = (process.env.REACT_APP_API_URL || '').trim();
  const normalizedEnv = trimTrailingSlash(envValue);

  if (normalizedEnv) {
    return normalizedEnv;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const mappedRenderApi = RENDER_API_BY_FRONTEND_HOST[window.location.host];
    if (mappedRenderApi) {
      return trimTrailingSlash(mappedRenderApi);
    }
    return trimTrailingSlash(window.location.origin);
  }

  return '';
};

export const API_BASE_URL = resolveApiBaseUrl();
