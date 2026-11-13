describe('API_BASE_URL', () => {
  const originalEnv = process.env.REACT_APP_API_URL;

  afterEach(() => {
    process.env.REACT_APP_API_URL = originalEnv;
    jest.resetModules();
  });

  test('uses the env value and trims trailing slashes', () => {
    process.env.REACT_APP_API_URL = 'https://api.example.com///';

    jest.isolateModules(() => {
      const { API_BASE_URL } = require('./api');
      expect(API_BASE_URL).toBe('https://api.example.com');
    });
  });

  test('defaults to the local backend during development without an API URL', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.REACT_APP_API_URL = '';
    process.env.NODE_ENV = 'development';
    try {
      jest.isolateModules(() => {
        expect(require('./api').API_BASE_URL).toBe('http://localhost:5000');
      });
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test('falls back to the current browser origin when env is not set', () => {
    process.env.REACT_APP_API_URL = '';

    jest.isolateModules(() => {
      const { API_BASE_URL } = require('./api');
      expect(API_BASE_URL).toBe(window.location.origin);
    });
  });
});