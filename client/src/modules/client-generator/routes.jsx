import ClientGeneratorHomePage from './pages/ClientGeneratorHomePage.jsx';
import ScenarioDetailPage from './pages/ScenarioDetailPage.jsx';

export default {
  id: 'client-generator',
  path: 'client-generator',
  label: 'Générateur de clients',
  description: 'Générez un client fictif avec sa personnalité et son besoin, puis démarrez une séance.',
  roles: ['STUDENT', 'TEACHER'],
  routes: [
    { path: '', element: <ClientGeneratorHomePage /> },
    { path: ':scenarioId', element: <ScenarioDetailPage /> },
  ],
};
