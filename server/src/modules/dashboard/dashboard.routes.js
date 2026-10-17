import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import * as controller from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/me/stats', requireRole('STUDENT'), controller.myStats);
dashboardRouter.get('/teacher/overview', requireRole('TEACHER'), controller.teacherOverview);
