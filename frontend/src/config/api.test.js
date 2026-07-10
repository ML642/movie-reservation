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

  test('falls back to the current browser origin when env is not set', () => {
    process.env.REACT_APP_API_URL = '';

    jest.isolateModules(() => {
      const { API_BASE_URL } = require('./api');
      expect(API_BASE_URL).toBe(window.location.origin);
    });
  });
});