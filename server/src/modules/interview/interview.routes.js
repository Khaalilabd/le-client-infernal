import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validate } from '../../shared/middleware/validate.js';
import { sessionParamsSchema, sendMessageBodySchema } from './interview.schemas.js';
import * as controller from './interview.controller.js';

export const interviewRouter = Router();

interviewRouter.use(authenticate);

interviewRouter.get('/sessions/:sessionId/messages', validate({ params: sessionParamsSchema }), controller.listMessages);
interviewRouter.post(
  '/sessions/:sessionId/messages',
  requireRole('STUDENT'),
  validate({ params: sessionParamsSchema, body: sendMessageBodySchema }),
  controller.sendMessage,
);
interviewRouter.post(
  '/sessions/:sessionId/end',
  requireRole('STUDENT'),
  validate({ params: sessionParamsSchema }),
  controller.endInterview,
);
interviewRouter.get('/sessions/:sessionId/progress', validate({ params: sessionParamsSchema }), controller.getProgress);
interviewRouter.get('/sessions/:sessionId/summary', validate({ params: sessionParamsSchema }), controller.getSummary);
