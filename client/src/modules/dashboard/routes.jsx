import DashboardHomePage from './pages/DashboardHomePage.jsx';

export default {
  id: 'dashboard',
  path: 'dashboard',
  label: 'Tableau de bord',
  description: 'Historique, statistiques, recommandation du prochain scénario et espace enseignant.',
  roles: ['STUDENT', 'TEACHER'],
  routes: [{ path: '', element: <DashboardHomePage /> }],
};
