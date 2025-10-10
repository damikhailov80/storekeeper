const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

// Создаем Next.js приложение
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Читаем SSL сертификаты
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '.ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '.ssl/cert.pem')),
  };

  // Создаем HTTPS сервер
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
      console.log(`> Local: https://localhost:${port}`);
      console.log(`> Network: https://192.168.1.58:${port}`);
    });
});