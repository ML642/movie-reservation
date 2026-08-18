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

let refreshPromise = null;

export const refreshAccessToken = async () => {
  if (!API_BASE_URL) return null;
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.token) return null;
        window.localStorage.setItem('token', data.token);
        if (data.user?.username) window.localStorage.setItem('username', data.user.username);
        if (data.user?.email) window.localStorage.setItem('userEmail', data.user.email);
        window.dispatchEvent(new Event('authchange'));
        return data.token;
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

export const authFetch = async (url, options = {}) => {
  const makeRequest = () => {
    const token = window.localStorage.getItem('token');
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers, credentials: 'include' });
  };

  let response = await makeRequest();
  if (response.status !== 401 || options.skipRefresh) return response;
  if (!(await refreshAccessToken())) return response;
  response = await makeRequest();
  return response;
};
