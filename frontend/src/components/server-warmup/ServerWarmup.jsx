import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import './ServerWarmup.css';

const RETRY_DELAY_MS = 5000;
const PROBE_TIMEOUT_MS = 10000;
const WARMUP_TIMEOUT_MS = 60000;

const wait = (delay, signal) => new Promise((resolve) => {
  const handleAbort = () => {
    window.clearTimeout(timeoutId);
    resolve();
  };
  const timeoutId = window.setTimeout(() => {
    signal.removeEventListener('abort', handleAbort);
    resolve();
  }, delay);
  signal.addEventListener('abort', handleAbort, { once: true });
});

const probeGateway = async (signal) => {
  const requestController = new AbortController();
  const abortRequest = () => requestController.abort();
  signal.addEventListener('abort', abortRequest, { once: true });
  const timeoutId = window.setTimeout(abortRequest, PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      credentials: 'include',
      cache: 'no-store',
      signal: requestController.signal,
    });

    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return false;
    const payload = await response.json();
    return payload?.status === 'ok';
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
    signal.removeEventListener('abort', abortRequest);
  }
};

const ServerWarmup = ({ children }) => {
  const [status, setStatus] = useState('warming');

  const startWarmup = useCallback(() => {
    setStatus('warming');
  }, []);

  useEffect(() => {
    if (status !== 'warming') return undefined;

    const controller = new AbortController();
    const deadline = Date.now() + WARMUP_TIMEOUT_MS;

    const warmUp = async () => {
      while (!controller.signal.aborted && Date.now() < deadline) {
        if (await probeGateway(controller.signal)) {
          if (!controller.signal.aborted) setStatus('ready');
          return;
        }
        await wait(RETRY_DELAY_MS, controller.signal);
      }

      if (!controller.signal.aborted) setStatus('timeout');
    };

    void warmUp();
    return () => controller.abort();
  }, [status]);

  if (status === 'ready') return children;

  return (
    <main className="server-warmup" aria-live="polite">
      <div className="server-warmup-card">
        <div className="server-warmup-spinner" aria-hidden="true" />
        <p className="server-warmup-kicker">CineReserve</p>
        <h1>{status === 'timeout' ? 'The server is taking longer than usual' : 'Starting the server'}</h1>
        <p>
          {status === 'timeout'
            ? 'The server has not responded yet. Please start the check again.'
            : 'The server needs a moment to wake up after being idle. Everything should be ready in about a minute.'}
        </p>
        {status === 'timeout' ? (
          <button type="button" onClick={startWarmup}>Try again</button>
        ) : (
          <span className="server-warmup-status">Checking the connection automatically...</span>
        )}
      </div>
    </main>
  );
};

export default ServerWarmup;
