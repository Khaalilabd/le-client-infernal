import { http } from '../../shared/api/http.js';

export const interviewApi = {
  listMessages: (sessionId) => http.get(`/interview/sessions/${sessionId}/messages`).then((data) => data.messages),
  sendMessage: (sessionId, content) => http.post(`/interview/sessions/${sessionId}/messages`, { content }),
  endInterview: (sessionId) => http.post(`/interview/sessions/${sessionId}/end`).then((data) => data.summary),
  getProgress: (sessionId) => http.get(`/interview/sessions/${sessionId}/progress`),
};
