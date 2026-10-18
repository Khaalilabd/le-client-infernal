import * as service from './requirements.service.js';
import * as versions from './versions.service.js';

export async function getDocument(req, res) {
  const document = await service.getDocument(req.valid.params.sessionId, req.user);
  res.json({ document });
}

export async function saveDocument(req, res) {
  const document = await service.saveDocument(req.valid.params.sessionId, req.user, req.valid.body.requirements);
  res.json({ document });
}

export async function submitDocument(req, res) {
  const document = await service.submitDocument(req.valid.params.sessionId, req.user);
  res.json({ document });
}

export async function evaluateDocument(req, res) {
  const evaluation = await service.evaluateDocument(req.valid.params.sessionId, req.user);
  res.status(201).json({ evaluation });
}

export async function listEvaluations(req, res) {
  const evaluations = await service.listEvaluations(req.valid.params.sessionId, req.user);
  res.json({ evaluations });
}

export async function createVersion(req, res) {
  const version = await versions.createVersion(req.valid.params.sessionId, req.user, req.valid.body);
  res.status(201).json({ version });
}

export async function listVersions(req, res) {
  const list = await versions.listVersions(req.valid.params.sessionId, req.user, req.valid.query);
  res.json({ versions: list });
}

export async function getVersion(req, res) {
  const version = await versions.getVersion(req.valid.params.sessionId, req.user, req.valid.params.version);
  res.json({ version });
}
