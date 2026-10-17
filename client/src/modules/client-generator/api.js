import { http } from '../../shared/api/http.js';

export const clientGeneratorApi = {
  listScenarios: () => http.get('/client-generator/scenarios').then((data) => data.scenarios),
  generateScenario: ({ domain, level }) =>
    http.post('/client-generator/scenarios', { domain, level }).then((data) => data.scenario),
};
