import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validate } from '../../shared/middleware/validate.js';
import { sessionParamsSchema, saveDocumentBodySchema } from './requirements.schemas.js';
import * as controller from './requirements.controller.js';

export const requirementsRouter = Router();

requirementsRouter.use(authenticate);

requirementsRouter.get('/sessions/:sessionId/document', validate({ params: sessionParamsSchema }), controller.getDocument);
requirementsRouter.put(
  '/sessions/:sessionId/document',
  requireRole('STUDENT'),
  validate({ params: sessionParamsSchema, body: saveDocumentBodySchema }),
  controller.saveDocument,
);
