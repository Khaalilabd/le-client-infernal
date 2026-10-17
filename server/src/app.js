// Construction de l'application Express (sans démarrer le serveur, pour faciliter les tests).
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { prisma } from './shared/db/prisma.js';
import { getAiInfo } from './shared/ai/index.js';
import { responseGuard } from './shared/middleware/responseGuard.js';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler.js';
import { authRouter } from './shared/auth/auth.routes.js';
import { sessionsRouter } from './shared/sessions/sessions.routes.js';
import { registerModules } from './modules/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));
  app.use(responseGuard);

  app.get('/api/health', async (req, res) => {
    let database = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'indisponible';
    }
    res.json({ status: 'ok', database, ai: getAiInfo() });
  });

  // Base commune
  app.use('/api/auth', authRouter);
  app.use('/api/sessions', sessionsRouter);

  // Modules (voir src/modules/index.js)
  registerModules(app);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
