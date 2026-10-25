import DashboardHomePage from './pages/DashboardHomePage.jsx';
import SessionReportPage from './pages/SessionReportPage.jsx';
import StudentDetailPage from './pages/StudentDetailPage.jsx';

export default {
  id: 'dashboard',
  path: 'dashboard',
  label: 'Tableau de bord',
  description: 'Historique, statistiques, recommandation du prochain scénario et espace enseignant.',
  roles: ['STUDENT', 'TEACHER'],
  routes: [
    { path: '', element: <DashboardHomePage /> },
    { path: 'sessions/:sessionId', element: <SessionReportPage /> },
    { path: 'students/:studentId', element: <StudentDetailPage /> },
  ],
};
