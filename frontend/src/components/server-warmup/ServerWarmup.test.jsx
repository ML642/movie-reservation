import { render, screen } from '@testing-library/react';
import ServerWarmup from './ServerWarmup';
import { API_BASE_URL } from '../../config/api';

describe('ServerWarmup', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('waits for the gateway health check before rendering the application', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json; charset=utf-8' },
      json: async () => ({ status: 'ok', service: 'gateway' }),
    });

    render(
      <ServerWarmup>
        <div>Application ready</div>
      </ServerWarmup>
    );

    expect(screen.getByText('Starting the server')).toBeInTheDocument();
    expect(screen.queryByText('Application ready')).not.toBeInTheDocument();
    expect(await screen.findByText('Application ready')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/health`,
      expect.objectContaining({ credentials: 'include', cache: 'no-store' })
    );
  });
});
