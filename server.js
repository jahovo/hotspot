const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const PORT = parseInt(process.env.PORT || '3456', 10);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
      }
    }
  }
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

const LOCAL_IP = getLocalIP();

function getBaseURL(req) {
  const host = req.headers.host || (LOCAL_IP + ':' + PORT);
  const proto = host.startsWith('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+/) ? 'http' : 'https';
  return proto + '://' + host;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // QR code SVG endpoint - uses the actual Host header for dynamic URL
  if (urlPath === '/qr.svg') {
    const baseURL = getBaseURL(req);
    QRCode.toString(baseURL, { type: 'svg', margin: 2, width: 256, color: { dark: '#1e293b', light: '#ffffff' } })
      .then(svg => {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
        res.end(svg);
      })
      .catch(err => {
        res.writeHead(500);
        res.end('QR generation failed');
      });
    return;
  }

  let filePath = urlPath === '/' ? '/index.html' : urlPath;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  \x1b[1m\x1b[36m============================================\x1b[0m');
  console.log('  \x1b[1m\x1b[36m  热点图片交互 - 服务器已启动\x1b[0m');
  console.log('  \x1b[1m\x1b[36m============================================\x1b[0m');
  console.log('');
  console.log('  \x1b[2m本地:\x1b[0m   http://localhost:' + PORT);
  console.log('  \x1b[2m局域网:\x1b[0m http://' + LOCAL_IP + ':' + PORT);
  console.log('');
  console.log('  \x1b[33m按 Ctrl+C 停止服务器\x1b[0m');
  console.log('');
});
