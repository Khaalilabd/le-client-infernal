import { http } from '../../shared/api/http.js';

export const requirementsApi = {
  getDocument: (sessionId) => http.get(`/requirements/sessions/${sessionId}/document`).then((data) => data.document),
  saveDocument: (sessionId, requirements) =>
    http.put(`/requirements/sessions/${sessionId}/document`, { requirements }).then((data) => data.document),
};
