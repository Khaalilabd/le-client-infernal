import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createSessionSchema, sessionIdParamsSchema, updateStatusSchema } from './sessions.schemas.js';
import * as controller from './sessions.controller.js';

export const sessionsRouter = Router();

sessionsRouter.use(authenticate);

sessionsRouter.get('/', controller.list);
sessionsRouter.post('/', requireRole('STUDENT'), validate({ body: createSessionSchema }), controller.create);
sessionsRouter.get('/:sessionId', validate({ params: sessionIdParamsSchema }), controller.getOne);
sessionsRouter.patch(
  '/:sessionId/status',
  requireRole('STUDENT'),
  validate({ params: sessionIdParamsSchema, body: updateStatusSchema }),
  controller.updateStatus,
);
