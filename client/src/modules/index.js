// Registre des modules côté client (base commune).
// Chaque module déclare ses routes, son libellé de menu et les rôles autorisés
// dans son propre fichier routes.jsx : inutile de modifier ce fichier.
import clientGenerator from './client-generator/routes.jsx';
import interview from './interview/routes.jsx';
import changeRequests from './change-requests/routes.jsx';
import requirements from './requirements/routes.jsx';
import dashboard from './dashboard/routes.jsx';

export const modules = [clientGenerator, interview, requirements, changeRequests, dashboard];
