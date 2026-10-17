import * as service from './dashboard.service.js';

export async function myStats(req, res) {
  const stats = await service.getStudentStats(req.user);
  res.json({ stats });
}

export async function teacherOverview(req, res) {
  const overview = await service.getTeacherOverview();
  res.json({ overview });
}
