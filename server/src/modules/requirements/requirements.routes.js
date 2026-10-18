import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  sessionParamsSchema,
  versionParamsSchema,
  saveDocumentBodySchema,
  createVersionBodySchema,
  listVersionsQuerySchema,
} from './requirements.schemas.js';
import * as controller from './requirements.controller.js';

export const requirementsRouter = Router();

requirementsRouter.use(authenticate);

const DOCUMENT = '/sessions/:sessionId/document';
const params = validate({ params: sessionParamsSchema });

// Document
requirementsRouter.get(DOCUMENT, params, controller.getDocument);
requirementsRouter.put(
  DOCUMENT,
  requireRole('STUDENT'),
  validate({ params: sessionParamsSchema, body: saveDocumentBodySchema }),
  controller.saveDocument,
);
requirementsRouter.post(`${DOCUMENT}/submit`, requireRole('STUDENT'), params, controller.submitDocument);

// Évaluation par le LLM
requirementsRouter.post(`${DOCUMENT}/evaluate`, requireRole('STUDENT'), params, controller.evaluateDocument);
requirementsRouter.get(`${DOCUMENT}/evaluations`, params, controller.listEvaluations);

// Versions successives (décision commune M3/M4)
requirementsRouter.post(
  `${DOCUMENT}/versions`,
  requireRole('STUDENT'),
  validate({ params: sessionParamsSchema, body: createVersionBodySchema }),
  controller.createVersion,
);
requirementsRouter.get(
  `${DOCUMENT}/versions`,
  validate({ params: sessionParamsSchema, query: listVersionsQuerySchema }),
  controller.listVersions,
);
requirementsRouter.get(`${DOCUMENT}/versions/:version`, validate({ params: versionParamsSchema }), controller.getVersion);
