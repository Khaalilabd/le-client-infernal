import { http } from '../../shared/api/http.js';

const documentPath = (sessionId) => `/requirements/sessions/${sessionId}/document`;

export const requirementsApi = {
  getDocument: (sessionId) => http.get(documentPath(sessionId)).then((data) => data.document),
  saveDocument: (sessionId, requirements) =>
    http.put(documentPath(sessionId), { requirements }).then((data) => data.document),
  submitDocument: (sessionId) => http.post(`${documentPath(sessionId)}/submit`).then((data) => data.document),

  evaluateDocument: (sessionId) => http.post(`${documentPath(sessionId)}/evaluate`).then((data) => data.evaluation),
  listEvaluations: (sessionId) => http.get(`${documentPath(sessionId)}/evaluations`).then((data) => data.evaluations),

  createVersion: (sessionId, { changeRequestId, reason, requirements }) =>
    http.post(`${documentPath(sessionId)}/versions`, { changeRequestId, reason, requirements }).then((data) => data.version),
  listVersions: (sessionId, { changeRequestId } = {}) =>
    http
      .get(`${documentPath(sessionId)}/versions${changeRequestId ? `?changeRequestId=${encodeURIComponent(changeRequestId)}` : ''}`)
      .then((data) => data.versions),
  getVersion: (sessionId, version) => http.get(`${documentPath(sessionId)}/versions/${version}`).then((data) => data.version),

  // Lecture seule de l'API du module 3, pour afficher la demande de changement à l'origine d'une nouvelle version.
  listChangeRequests: (sessionId) => http.get(`/change-requests/sessions/${sessionId}`).then((data) => data.changeRequests),
};
