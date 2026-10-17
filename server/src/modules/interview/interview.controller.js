import * as service from './interview.service.js';

export async function listMessages(req, res) {
  const messages = await service.listMessages(req.valid.params.sessionId, req.user);
  res.json({ messages });
}

export async function sendMessage(req, res) {
  const result = await service.sendMessage(req.valid.params.sessionId, req.user, req.valid.body.content);
  res.status(201).json(result);
}
