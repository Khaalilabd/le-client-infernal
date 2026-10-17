import ChangeRequestsHomePage from './pages/ChangeRequestsHomePage.jsx';

export default {
  id: 'change-requests',
  path: 'change-requests',
  label: 'Demandes de changement',
  description: 'Répondez aux demandes de changement du client : accepter, négocier ou refuser.',
  roles: ['STUDENT', 'TEACHER'],
  routes: [{ path: '', element: <ChangeRequestsHomePage /> }],
};
