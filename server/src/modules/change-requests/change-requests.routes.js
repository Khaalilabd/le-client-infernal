import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validate } from '../../shared/middleware/validate.js';
import { sessionParamsSchema } from './change-requests.schemas.js';
import * as controller from './change-requests.controller.js';

export const changeRequestsRouter = Router();

changeRequestsRouter.use(authenticate);

changeRequestsRouter.get('/sessions/:sessionId', validate({ params: sessionParamsSchema }), controller.list);
changeRequestsRouter.post(
  '/sessions/:sessionId/generate',
  requireRole('STUDENT'),
  validate({ params: sessionParamsSchema }),
  controller.generate,
);
