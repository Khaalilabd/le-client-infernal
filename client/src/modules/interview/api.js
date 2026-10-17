import { http } from '../../shared/api/http.js';

export const interviewApi = {
  listMessages: (sessionId) => http.get(`/interview/sessions/${sessionId}/messages`).then((data) => data.messages),
  sendMessage: (sessionId, content) => http.post(`/interview/sessions/${sessionId}/messages`, { content }),
};
