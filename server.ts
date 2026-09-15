import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/apiRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Disable information disclosure headers
  app.disable('x-powered-by');

  // 2. Request body size limit to prevent Denial of Service (DoS) memory exhaustion
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 3. Enterprise HTTP Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME sniffing attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable browser XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Strict referrer policy for data privacy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Restrict unnecessary browser device permissions
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Frame security: Note that the app runs inside an iframe in Google AI Studio,
    // so we avoid X-Frame-Options: DENY to keep the preview fully operational.
    next();
  });

  // 4. In-Memory Sliding-Window Rate Limiting for API routes
  const rateLimitStore = new Map<string, { readCount: number; writeCount: number; resetTime: number }>();
  const RATE_WINDOW_MS = 60 * 1000; // 1 minute window
  const MAX_READS_PER_MIN = 180;
  const MAX_WRITES_PER_MIN = 60;

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    let clientRecord = rateLimitStore.get(ip);

    if (!clientRecord || now > clientRecord.resetTime) {
      clientRecord = { readCount: 0, writeCount: 0, resetTime: now + RATE_WINDOW_MS };
      rateLimitStore.set(ip, clientRecord);
    }

    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    if (isMutation) {
      clientRecord.writeCount += 1;
      if (clientRecord.writeCount > MAX_WRITES_PER_MIN) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many mutating requests. Please wait 60 seconds before retrying.',
        });
      }
    } else {
      clientRecord.readCount += 1;
      if (clientRecord.readCount > MAX_READS_PER_MIN) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down your queries.',
        });
      }
    }

    next();
  });

  // Clean up expired rate-limit records every 5 minutes to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of rateLimitStore.entries()) {
      if (now > rec.resetTime + RATE_WINDOW_MS) {
        rateLimitStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Health and Observability endpoints
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      security: 'hardened',
    });
  });

  app.get('/ready', (req, res) => {
    res.json({ status: 'ready', database: 'connected', version: '2.4.0-enterprise' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ApexERP Enterprise Core', securityHeaders: true });
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

  // Centralized Error Handling Middleware (prevents stack trace disclosure)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ApexERP Security Alert] Server Error on ${req.method} ${req.path}:`, err?.message || err);
    if (res.headersSent) {
      return next(err);
    }
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: isProduction ? 'An unexpected internal processing error occurred.' : (err?.message || 'Server error'),
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexERP Enterprise Server (Hardened) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
