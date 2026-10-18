// Tests d'intégration des endpoints du module client-generator.
// Nécessitent la base de démonstration (npm run db:up && npm run db:seed) ;
// ils sont ignorés automatiquement si la base est inaccessible.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';

const { createApp } = await import('../../../app.js');
const { prisma } = await import('../../../shared/db/prisma.js');
const { getScenarioSecrets } = await import('../../../shared/db/scenarioSecrets.js');

const PASSWORD = 'Password123!';
let server;
let baseUrl;
let skipReason = null;
const tokens = {};
const createdIds = [];

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}/api/client-generator${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, text, json: text ? JSON.parse(text) : null };
}

async function login(email) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`Connexion impossible pour ${email}`);
  return (await response.json()).token;
}

before(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    skipReason = 'base de données inaccessible (npm run db:up)';
    return;
  }
  server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    tokens.student = await login('etudiant1@demo.tn');
    tokens.teacher = await login('enseignant@demo.tn');
  } catch {
    skipReason = 'comptes de démonstration absents (npm run db:seed)';
  }
});

after(async () => {
  if (createdIds.length) await prisma.scenario.deleteMany({ where: { id: { in: createdIds } } });
  server?.close();
  await prisma.$disconnect();
});

// Vérifie qu'aucun secret ne sort, sans compter sur le filet de sécurité responseGuard
function assertNoSecret(text, secrets = []) {
  assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
  assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  for (const secret of secrets) assert.ok(!text.includes(secret), 'contenu secret présent dans la réponse');
}

test('endpoints du module client-generator', async (t) => {
  if (skipReason) return t.skip(skipReason);

  const guardAlerts = [];
  const originalError = console.error;
  console.error = (...args) => {
    if (String(args[0]).includes('responseGuard')) guardAlerts.push(args[0]);
    else originalError(...args);
  };
  t.after(() => {
    console.error = originalError;
  });

  await t.test('authentification obligatoire', async () => {
    assert.equal((await api('GET', '/options')).status, 401);
  });

  await t.test('GET /options', async () => {
    const { status, json } = await api('GET', '/options', { token: tokens.student });
    assert.equal(status, 200);
    assert.equal(json.levels.length, 3);
    assert.equal(json.personalities.length, 6);
    assert.ok(json.domains.length > 0);
    assert.ok(!('behavior' in json.personalities[0]), 'le texte de prompt ne doit pas être exposé');
  });

  let scenarioId;
  await t.test('POST /scenarios génère un scénario public avec la personnalité choisie', async () => {
    const { status, json, text } = await api('POST', '/scenarios', {
      token: tokens.student,
      body: { domain: 'Logistique', level: 'ADVANCED', personality: 'SKEPTICAL' },
    });
    assert.equal(status, 201);
    scenarioId = json.scenario.id;
    createdIds.push(scenarioId);
    assert.equal(json.scenario.personality.profile, 'SKEPTICAL');
    assert.equal(json.scenario.level, 'ADVANCED');

    const secrets = await getScenarioSecrets(scenarioId);
    assert.ok(secrets.hiddenNeed.length > 0, 'le besoin caché est bien enregistré en base');
    assert.ok(secrets.implicitConstraints.length >= 3, 'niveau avancé : au moins 3 contraintes');
    assertNoSecret(text, [secrets.hiddenNeed, ...secrets.implicitConstraints]);
  });

  await t.test('POST /scenarios refuse des données invalides', async () => {
    const { status, json } = await api('POST', '/scenarios', { token: tokens.student, body: { domain: 'x', level: 'EXPERT' } });
    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  await t.test('GET /scenarios filtre par personnalité, niveau et domaine', async () => {
    const { status, json, text } = await api('GET', '/scenarios?personality=SKEPTICAL&level=ADVANCED&domain=logis', { token: tokens.student });
    assert.equal(status, 200);
    assert.ok(json.scenarios.some((scenario) => scenario.id === scenarioId));
    assert.ok(json.scenarios.every((scenario) => scenario.personality.profile === 'SKEPTICAL' && scenario.level === 'ADVANCED'));
    assertNoSecret(text);
  });

  await t.test('GET /scenarios/:id renvoie la version publique', async () => {
    const { status, json, text } = await api('GET', `/scenarios/${scenarioId}`, { token: tokens.student });
    assert.equal(status, 200);
    assert.equal(json.scenario.id, scenarioId);
    assertNoSecret(text);
    assert.equal((await api('GET', '/scenarios/inexistant', { token: tokens.student })).status, 404);
  });

  await t.test('DELETE /scenarios/:id est réservé à l\'enseignant', async () => {
    assert.equal((await api('DELETE', `/scenarios/${scenarioId}`, { token: tokens.student })).status, 403);
    assert.equal((await api('DELETE', `/scenarios/${scenarioId}`, { token: tokens.teacher })).status, 204);
    assert.equal((await api('GET', `/scenarios/${scenarioId}`, { token: tokens.student })).status, 404);
  });

  await t.test('DELETE refuse un scénario utilisé par des séances (409)', async () => {
    const used = await prisma.trainingSession.findFirst({ select: { scenarioId: true } });
    if (!used) return;
    const { status, json } = await api('DELETE', `/scenarios/${used.scenarioId}`, { token: tokens.teacher });
    assert.equal(status, 409);
    assert.equal(json.error.code, 'SCENARIO_IN_USE');
  });

  await t.test('le filet de sécurité responseGuard n\'a jamais eu à intervenir', () => {
    assert.deepEqual(guardAlerts, []);
  });
});
