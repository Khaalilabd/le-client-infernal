import * as service from './requirements.service.js';

export async function getDocument(req, res) {
  const document = await service.getDocument(req.valid.params.sessionId, req.user);
  res.json({ document });
}

export async function saveDocument(req, res) {
  const document = await service.saveDocument(req.valid.params.sessionId, req.user, req.valid.body.requirements);
  res.json({ document });
}
