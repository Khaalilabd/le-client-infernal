import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validate } from '../../shared/middleware/validate.js';
import { sessionParamsSchema, changeRequestParamsSchema, respondBodySchema } from './change-requests.schemas.js';
import * as controller from './change-requests.controller.js';

export const changeRequestsRouter = Router();

changeRequestsRouter.use(authenticate);

// Liste les demandes de changement d'une séance
changeRequestsRouter.get('/sessions/:sessionId', validate({ params: sessionParamsSchema }), controller.list);

// Génère une nouvelle demande de changement (réservé à l'étudiant propriétaire)
changeRequestsRouter.post(
  '/sessions/:sessionId/generate',
  requireRole('STUDENT'),
  validate({ params: sessionParamsSchema }),
  controller.generate,
);

// Répond à une demande de changement (réservé à l'étudiant propriétaire)
changeRequestsRouter.post(
  '/:changeRequestId/respond',
  requireRole('STUDENT'),
  validate({ params: changeRequestParamsSchema, body: respondBodySchema }),
  controller.respond,
);
