import ChangeRequestsPage from './pages/ChangeRequestsPage.jsx';

export default {
  id: 'change-requests',
  path: 'change-requests',
  label: 'Demandes de changement',
  description: 'Répondez aux demandes de changement du client : accepter, négocier ou refuser.',
  roles: ['STUDENT', 'TEACHER'],
  routes: [{ path: '', element: <ChangeRequestsPage /> }],
};
