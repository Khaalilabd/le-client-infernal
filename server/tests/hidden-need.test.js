// Le besoin caché ne doit jamais quitter le serveur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPublicScenario } from '../src/shared/serializers/scenario.js';
import { stripSecrets, responseGuard } from '../src/shared/middleware/responseGuard.js';

const scenario = {
  id: 's1',
  title: 'Test',
  expressedNeed: 'Un site web',
  hiddenNeed: 'SECRET',
  implicitConstraints: ['SECRET'],
};

test('toPublicScenario retire les champs secrets', () => {
  const result = toPublicScenario(scenario);
  assert.equal(result.hiddenNeed, undefined);
  assert.equal(result.implicitConstraints, undefined);
  assert.equal(result.expressedNeed, 'Un site web');
});

test('stripSecrets retire les champs secrets imbriqués', () => {
  const body = { sessions: [{ id: 'x', scenario }] };
  const clean = stripSecrets(body);
  assert.ok(!JSON.stringify(clean).includes('SECRET'));
});

test('responseGuard filtre res.json', () => {
  let sent;
  const res = { json: (body) => (sent = body) };
  const originalError = console.error;
  console.error = () => {};
  try {
    responseGuard({ method: 'GET', originalUrl: '/test' }, res, () => {});
    res.json({ scenario });
  } finally {
    console.error = originalError;
  }
  assert.ok(!JSON.stringify(sent).includes('SECRET'));
});
