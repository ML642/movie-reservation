require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.UPSTREAM_TIMEOUT_MS || '30000', 10);
const SHUTDOWN_TIMEOUT_MS = 25_000;

const getAllowedOrigins = () => (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const getTargets = () => [
  ['/api/likes', process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:5002'],
  ['/api/comments', process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:5002'],
  ['/api/reservation', process.env.RESERVATION_SERVICE_URL || 'http://localhost:5003'],
  ['/', process.env.IDENTITY_SERVICE_URL || 'http://localhost:5001'],
];

const requestPath = (req) => (req.url || '/').split('?')[0];

const log = (logger, event, details = {}) => {
  logger.log(JSON.stringify({
    service: 'gateway',
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }));
};

const errorDetails = (error) => ({
  code: error?.code || 'UNKNOWN',
  message: error?.message || 'Unknown proxy error',
});

const sendJson = (res, status, body, headers = {}) => {
  if (res.destroyed || res.writableEnded || res.headersSent) return false;
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
  return true;
};

const createGateway = ({
  targets = getTargets(),
  allowedOrigins = getAllowedOrigins(),
  timeoutMs = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0 ? REQUEST_TIMEOUT_MS : 30_000,
  logger = console,
} = {}) => {
  const allowedOriginSet = new Set(allowedOrigins);
  const corsHeadersFor = (origin) => {
    if (!origin || !allowedOriginSet.has(origin)) return {};
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      Vary: 'Origin',
    };
  };

  const gateway = http.createServer((req, res) => {
    const corsHeaders = corsHeadersFor(req.headers.origin);
    const path = requestPath(req);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      return res.end();
    }

    // Keep this endpoint inside the gateway. The frontend uses it to wake a
    // sleeping Render instance before mounting components that would otherwise
    // send several API requests at the same time.
    if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
      return sendJson(res, 200, { status: 'ok', service: 'gateway' }, corsHeaders);
    }

    const route = targets.find(([prefix]) => path.startsWith(prefix));
    if (!route) {
      log(logger, 'route_not_found', { method: req.method, path });
      return sendJson(res, 404, { success: false, message: 'Route not found' }, corsHeaders);
    }

    const target = new URL(route[1]);
    const transport = target.protocol === 'https:' ? https : http;
    const upstream = target.origin;
    let proxyErrorHandled = false;

    const respondToProxyError = (error) => {
      if (proxyErrorHandled) return;
      proxyErrorHandled = true;
      log(logger, 'upstream_error', {
        method: req.method,
        path,
        upstream,
        ...errorDetails(error),
      });
      sendJson(res, 502, { success: false, message: 'Service unavailable' }, corsHeaders);
    };

    const proxy = transport.request({
      hostname: target.hostname,
      port: target.port || undefined,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: target.host },
    }, (service) => {
      const responseHeaders = { ...service.headers };
      for (const headerName of Object.keys(responseHeaders)) {
        if (headerName.toLowerCase().startsWith('access-control-') || headerName.toLowerCase() === 'vary') {
          delete responseHeaders[headerName];
        }
      }

      if (!res.destroyed && !res.writableEnded) {
        res.writeHead(service.statusCode || 502, { ...responseHeaders, ...corsHeaders });
        service.pipe(res);
      } else {
        service.resume();
      }

      service.on('error', (error) => {
        log(logger, 'upstream_response_error', { method: req.method, path, upstream, ...errorDetails(error) });
        if (!res.headersSent) respondToProxyError(error);
        else res.destroy(error);
      });
    });

    proxy.setTimeout(timeoutMs, () => {
      const error = new Error(`Upstream request timed out after ${timeoutMs}ms`);
      error.code = 'ETIMEDOUT';
      proxy.destroy(error);
    });
    proxy.on('error', respondToProxyError);

    req.on('aborted', () => {
      log(logger, 'client_aborted_request', { method: req.method, path, upstream });
      proxy.destroy();
    });
    res.on('close', () => {
      if (!res.writableEnded) proxy.destroy();
    });
    req.pipe(proxy);
  });

  gateway.on('clientError', (error, socket) => {
    log(logger, 'client_error', errorDetails(error));
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  return gateway;
};

const gateway = createGateway();

const startGateway = (port = process.env.PORT || 5000) => gateway.listen(port, '0.0.0.0', () => {
  log(console, 'listening', { port });
});

const shutdown = (signal) => {
  log(console, 'shutdown_started', { signal });
  const forceExit = setTimeout(() => {
    log(console, 'shutdown_timeout', { signal });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();
  gateway.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
    clearTimeout(forceExit);
    log(console, 'shutdown_complete', { signal });
  });
};

if (require.main === module) {
  startGateway();
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

module.exports = gateway;
module.exports.createGateway = createGateway;
module.exports.startGateway = startGateway;
