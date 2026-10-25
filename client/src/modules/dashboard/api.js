import { http } from '../../shared/api/http.js';

export const dashboardApi = {
  // Espace étudiant
  getMyStats: () => http.get('/dashboard/me/stats').then((data) => data.stats),
  getMyHistory: () => http.get('/dashboard/me/history').then((data) => data.sessions),
  getMyRecommendation: () => http.get('/dashboard/me/recommendation').then((data) => data.recommendation),

  // Bilan d'une séance (étudiant propriétaire ou enseignant) : { session, breakdown }
  getSessionReport: (sessionId) => http.get(`/dashboard/sessions/${sessionId}/report`),

  // Espace enseignant
  getTeacherOverview: () => http.get('/dashboard/teacher/overview').then((data) => data.overview),
  getStudentDetails: (studentId) => http.get(`/dashboard/teacher/students/${studentId}`),
  addTeacherFeedback: (sessionId, data) =>
    http.post(`/dashboard/teacher/sessions/${sessionId}/feedback`, data).then((res) => res.feedback),
};
