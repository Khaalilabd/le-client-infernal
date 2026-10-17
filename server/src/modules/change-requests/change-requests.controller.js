import * as service from './change-requests.service.js';

export async function list(req, res) {
  const changeRequests = await service.listChangeRequests(req.valid.params.sessionId, req.user);
  res.json({ changeRequests });
}

export async function generate(req, res) {
  const changeRequest = await service.generateChangeRequest(req.valid.params.sessionId, req.user);
  res.status(201).json({ changeRequest });
}
