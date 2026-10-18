import * as service from './client-generator.service.js';

export function options(req, res) {
  res.json(service.getOptions());
}

export async function generate(req, res) {
  const scenario = await service.generateScenario(req.valid.body, req.user);
  res.status(201).json({ scenario });
}

export async function list(req, res) {
  const scenarios = await service.listScenarios(req.valid.query);
  res.json({ scenarios });
}

export async function getOne(req, res) {
  const scenario = await service.getScenario(req.valid.params.scenarioId);
  res.json({ scenario });
}

export async function remove(req, res) {
  await service.deleteScenario(req.valid.params.scenarioId);
  res.status(204).end();
}
