import InterviewHomePage from './pages/InterviewHomePage.jsx';

export default {
  id: 'interview',
  path: 'interview',
  label: 'Entretien client',
  description: 'Interrogez le client simulé pour découvrir son véritable besoin.',
  roles: ['STUDENT', 'TEACHER'],
  routes: [{ path: '', element: <InterviewHomePage /> }],
};
