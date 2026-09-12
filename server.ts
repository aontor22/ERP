import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/apiRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health and Observability endpoints
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  app.get('/ready', (req, res) => {
    res.json({ status: 'ready', database: 'connected', version: '2.4.0-enterprise' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ApexERP Enterprise Core' });
  });

  // Mount REST API v1
  app.use('/api/v1', apiRouter);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexERP Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
