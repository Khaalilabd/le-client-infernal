import { http } from '../../shared/api/http.js';

export const changeRequestsApi = {
  /** Liste les demandes de changement d'une séance */
  list: (sessionId) =>
    http.get(`/change-requests/sessions/${sessionId}`).then((data) => data.changeRequests),

  /** Génère une nouvelle demande de changement */
  generate: (sessionId) =>
    http.post(`/change-requests/sessions/${sessionId}/generate`).then((data) => data.changeRequest),

  /** Répond à une demande de changement */
  respond: (changeRequestId, { decision, justification }) =>
    http
      .post(`/change-requests/${changeRequestId}/respond`, { decision, justification })
      .then((data) => data),
};
