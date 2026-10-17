// Séances d'entraînement (base commune), utilisées par plusieurs modules.
import { http } from './http.js';

export const sessionsApi = {
  list: () => http.get('/sessions').then((data) => data.sessions),
  get: (sessionId) => http.get(`/sessions/${sessionId}`).then((data) => data.session),
  create: (scenarioId) => http.post('/sessions', { scenarioId }).then((data) => data.session),
  updateStatus: (sessionId, status) => http.patch(`/sessions/${sessionId}/status`, { status }).then((data) => data.session),
};
