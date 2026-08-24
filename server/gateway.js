require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

// Keep the local CRA frontend working out of the box while production origins
// remain explicitly configurable through CORS_ORIGINS.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsHeadersFor = (origin) => {
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    Vary: 'Origin',
  };
};

const targets = [
  ['/api/likes', process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:5002'],
  ['/api/comments', process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:5002'],
  ['/api/reservation', process.env.RESERVATION_SERVICE_URL || 'http://localhost:5003'],
  ['/', process.env.IDENTITY_SERVICE_URL || 'http://localhost:5001'],
];

const gateway = http.createServer((req, res) => {
  const corsHeaders = corsHeadersFor(req.headers.origin);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  const target = new URL(targets.find(([prefix]) => req.url.startsWith(prefix))[1]);
  const transport = target.protocol === 'https:' ? https : http;
  const proxy = transport.request({ hostname: target.hostname, port: target.port || undefined, path: req.url, method: req.method, headers: { ...req.headers, host: target.host } }, (service) => {
    const responseHeaders = { ...service.headers };
    for (const headerName of Object.keys(responseHeaders)) {
      if (headerName.toLowerCase().startsWith('access-control-') || headerName.toLowerCase() === 'vary') {
        delete responseHeaders[headerName];
      }
    }
    res.writeHead(service.statusCode || 502, { ...responseHeaders, ...corsHeaders });
    service.pipe(res);
  });
  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ success: false, message: 'Service unavailable' }));
  });
  req.pipe(proxy);
});

if (require.main === module) gateway.listen(process.env.PORT || 5000);
module.exports = gateway;
