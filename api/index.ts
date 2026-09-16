import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../src/server/apiRoutes.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Enterprise HTTP Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Health checks
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ApexERP Enterprise Core (Vercel Serverless)', runtime: 'nodejs' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', runtime: 'vercel-serverless' });
});

// Mount API v1
app.use('/api/v1', apiRouter);

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Vercel Serverless Error]:', err?.message || err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    error: 'SERVER_ERROR',
    message: err?.message || 'Internal server error',
  });
});

export default app;
