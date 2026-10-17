import { http } from '../../shared/api/http.js';

export const changeRequestsApi = {
  list: (sessionId) => http.get(`/change-requests/sessions/${sessionId}`).then((data) => data.changeRequests),
  generate: (sessionId) =>
    http.post(`/change-requests/sessions/${sessionId}/generate`).then((data) => data.changeRequest),
};
