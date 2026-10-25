import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validate } from '../../shared/middleware/validate.js';
import * as controller from './dashboard.controller.js';
import { sessionParamsSchema, studentIdParamsSchema, teacherFeedbackBodySchema } from './dashboard.schemas.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// Espace étudiant
dashboardRouter.get('/me/stats', requireRole('STUDENT'), controller.myStats);
dashboardRouter.get('/me/history', requireRole('STUDENT'), controller.myHistory);
dashboardRouter.get('/me/recommendation', requireRole('STUDENT'), controller.myRecommendation);

// Bilan d'une séance (étudiant propriétaire ou enseignant)
dashboardRouter.get('/sessions/:sessionId/report', validate({ params: sessionParamsSchema }), controller.sessionReport);

// Espace enseignant
dashboardRouter.get('/teacher/overview', requireRole('TEACHER'), controller.teacherOverview);
dashboardRouter.get(
  '/teacher/students/:studentId',
  requireRole('TEACHER'),
  validate({ params: studentIdParamsSchema }),
  controller.studentDetails
);
dashboardRouter.post(
  '/teacher/sessions/:sessionId/feedback',
  requireRole('TEACHER'),
  validate({ params: sessionParamsSchema, body: teacherFeedbackBodySchema }),
  controller.addFeedback
);
