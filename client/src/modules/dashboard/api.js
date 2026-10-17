import { http } from '../../shared/api/http.js';

export const dashboardApi = {
  getMyStats: () => http.get('/dashboard/me/stats').then((data) => data.stats),
  getTeacherOverview: () => http.get('/dashboard/teacher/overview').then((data) => data.overview),
};
