import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  generateScenarioBodySchema,
  listScenariosQuerySchema,
  scenarioIdParamsSchema,
} from './client-generator.schemas.js';
import * as controller from './client-generator.controller.js';

export const clientGeneratorRouter = Router();

clientGeneratorRouter.use(authenticate);

clientGeneratorRouter.post('/scenarios', validate({ body: generateScenarioBodySchema }), controller.generate);
clientGeneratorRouter.get('/scenarios', validate({ query: listScenariosQuerySchema }), controller.list);
clientGeneratorRouter.get('/scenarios/:scenarioId', validate({ params: scenarioIdParamsSchema }), controller.getOne);
