import * as service from './dashboard.service.js';

export async function myStats(req, res) {
  const stats = await service.getStudentStats(req.user);
  res.json({ stats });
}

export async function myHistory(req, res) {
  const sessions = await service.getHistory(req.user);
  res.json({ sessions });
}

export async function myRecommendation(req, res) {
  const recommendation = await service.getRecommendationForDisplay(req.user);
  res.json({ recommendation });
}

export async function sessionReport(req, res) {
  const report = await service.getSessionReport(req.valid.params.sessionId, req.user);
  res.json(report);
}

export async function teacherOverview(req, res) {
  const overview = await service.getTeacherOverview();
  res.json({ overview });
}

export async function studentDetails(req, res) {
  const { studentId } = req.valid.params;
  const data = await service.getStudentDetails(studentId);
  res.json(data);
}

export async function addFeedback(req, res) {
  const { sessionId } = req.valid.params;
  const { comment, grade } = req.valid.body;
  const feedback = await service.addTeacherFeedback(sessionId, req.user, { comment, grade });
  res.status(201).json({ feedback });
}
