// Registre des modules : monte le routeur de chaque module sous /api/<module>.
// Ce fichier fait partie de la base commune : chaque module expose son routeur
// dans son propre index.js, il n'est donc pas nécessaire de modifier ce fichier.
import { clientGeneratorModule } from './client-generator/index.js';
import { interviewModule } from './interview/index.js';
import { changeRequestsModule } from './change-requests/index.js';
import { requirementsModule } from './requirements/index.js';
import { dashboardModule } from './dashboard/index.js';

export const modules = [
  clientGeneratorModule,
  interviewModule,
  changeRequestsModule,
  requirementsModule,
  dashboardModule,
];

export function registerModules(app) {
  for (const module of modules) {
    app.use(`/api/${module.name}`, module.router);
  }
}
