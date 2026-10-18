import { http } from '../../shared/api/http.js';

function toQuery(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const clientGeneratorApi = {
  getOptions: () => http.get('/client-generator/options'),
  listScenarios: (filters) => http.get(`/client-generator/scenarios${toQuery(filters)}`).then((data) => data.scenarios),
  getScenario: (scenarioId) => http.get(`/client-generator/scenarios/${scenarioId}`).then((data) => data.scenario),
  generateScenario: ({ domain, level, personality }) =>
    http.post('/client-generator/scenarios', { domain, level, personality }).then((data) => data.scenario),
  deleteScenario: (scenarioId) => http.delete(`/client-generator/scenarios/${scenarioId}`),
};
