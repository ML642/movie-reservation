require('dotenv').config();
const http = require('http');
const { URL } = require('url');

const targets = [
  ['/api/likes', process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:5002'],
  ['/api/comments', process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:5002'],
  ['/api/reservation', process.env.RESERVATION_SERVICE_URL || 'http://localhost:5003'],
  ['/', process.env.IDENTITY_SERVICE_URL || 'http://localhost:5001'],
];

const gateway = http.createServer((req, res) => {
  const target = new URL(targets.find(([prefix]) => req.url.startsWith(prefix))[1]);
  const proxy = http.request({ hostname: target.hostname, port: target.port, path: req.url, method: req.method, headers: { ...req.headers, host: target.host } }, (service) => {
    res.writeHead(service.statusCode || 502, service.headers);
    service.pipe(res);
  });
  proxy.on('error', () => res.end(JSON.stringify({ success: false, message: 'Service unavailable' })));
  req.pipe(proxy);
});

if (require.main === module) gateway.listen(process.env.PORT || 5000);
module.exports = gateway;
