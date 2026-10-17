import RequirementsHomePage from './pages/RequirementsHomePage.jsx';

export default {
  id: 'requirements',
  path: 'requirements',
  label: 'Cahier des charges',
  description: 'Rédigez exigences fonctionnelles, non fonctionnelles et user stories, puis faites-les évaluer.',
  roles: ['STUDENT', 'TEACHER'],
  routes: [{ path: '', element: <RequirementsHomePage /> }],
};
