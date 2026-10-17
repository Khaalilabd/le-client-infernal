import * as sessionsService from './sessions.service.js';

export async function create(req, res) {
  const session = await sessionsService.createSession(req.user, req.valid.body.scenarioId);
  res.status(201).json({ session });
}

export async function list(req, res) {
  const sessions = await sessionsService.listSessions(req.user);
  res.json({ sessions });
}

export async function getOne(req, res) {
  const session = await sessionsService.getSession(req.valid.params.sessionId, req.user);
  res.json({ session });
}

export async function updateStatus(req, res) {
  const session = await sessionsService.updateStatus(req.valid.params.sessionId, req.user, req.valid.body.status);
  res.json({ session });
}
