import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);

  function originAllowed(origin?: string) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return true;
    try {
      const host = new URL(origin).hostname;
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (host.endsWith('.trycloudflare.com') || host.endsWith('.surge.sh')) return true;
    } catch {
      return false;
    }
    return false;
  }

  app.use(
    cors({
      origin(origin, cb) {
        cb(null, originAllowed(origin));
      },
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === 'test' ? 'tiny' : 'dev'));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(globalRateLimiter);

  app.use('/api/v1', routes);

  if (env.NODE_ENV === 'production') {
    const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
    if (existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          next();
          return;
        }
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
