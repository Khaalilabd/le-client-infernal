// Tests d'intégration des endpoints du module requirements.
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
const createdSessionIds = [];

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}/api/requirements${path}`, {
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
    tokens.other = await login('etudiant2@demo.tn');
    tokens.teacher = await login('enseignant@demo.tn');
  } catch {
    skipReason = 'comptes de démonstration absents (npm run db:seed)';
  }
});

after(async () => {
  if (createdSessionIds.length) await prisma.trainingSession.deleteMany({ where: { id: { in: createdSessionIds } } });
  server?.close();
  await prisma.$disconnect();
});

// Vérifie qu'aucun secret ne sort, sans compter sur le filet de sécurité responseGuard
function assertNoSecret(text, secrets = []) {
  assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
  assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  for (const secret of secrets) assert.ok(!text.includes(secret), 'contenu secret présent dans la réponse');
}

const REQUIREMENTS = [
  {
    type: 'FUNCTIONAL',
    code: 'EF-01',
    title: 'Saisie d\'une commande',
    description: 'Le système doit permettre d\'enregistrer une commande avec la date de retrait.',
    priority: 'MUST',
  },
  {
    type: 'USER_STORY',
    code: 'US-01',
    title: 'Liste du lendemain',
    description: 'En tant que vendeur, je veux la liste des commandes du lendemain afin de ne rien oublier.',
    priority: 'SHOULD',
    acceptanceCriteria: ['La liste est disponible chaque soir à 18 h'],
  },
];

async function createChangeRequest(sessionId, data = {}) {
  return prisma.changeRequest.create({
    data: {
      sessionId,
      title: 'Ajouter la livraison à domicile',
      description: 'Le client souhaite livrer certaines commandes.',
      reason: 'Demande de plusieurs clients fidèles.',
      impact: { scope: 'Commandes', effort: 'MEDIUM', risk: 'Organisation des tournées' },
      ...data,
    },
  });
}

test('endpoints du module requirements', async (t) => {
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

  // Séance dédiée au test, sur un scénario de démonstration
  const student = await prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } });
  const scenario = await prisma.scenario.findFirst();
  const session = await prisma.trainingSession.create({ data: { studentId: student.id, scenarioId: scenario.id } });
  createdSessionIds.push(session.id);
  const secretsRecord = await getScenarioSecrets(scenario.id);
  const secrets = [secretsRecord.hiddenNeed, ...secretsRecord.implicitConstraints];
  const doc = `/sessions/${session.id}/document`;

  await t.test('authentification obligatoire et accès réservé au propriétaire ou à l\'enseignant', async () => {
    assert.equal((await api('GET', doc)).status, 401);
    assert.equal((await api('GET', doc, { token: tokens.other })).status, 403);
    assert.equal((await api('GET', doc, { token: tokens.teacher })).status, 200);
  });

  await t.test('GET crée un brouillon vide', async () => {
    const { status, json, text } = await api('GET', doc, { token: tokens.student });
    assert.equal(status, 200);
    assert.equal(json.document.status, 'DRAFT');
    assert.equal(json.document.currentVersion, null);
    assert.deepEqual(json.document.requirements, []);
    assertNoSecret(text, secrets);
  });

  await t.test('PUT enregistre le brouillon ; l\'enseignant et les données invalides sont refusés', async () => {
    assert.equal((await api('PUT', doc, { token: tokens.teacher, body: { requirements: REQUIREMENTS } })).status, 403);

    const invalid = await api('PUT', doc, { token: tokens.student, body: { requirements: [{ ...REQUIREMENTS[0], code: 'US-01' }] } });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.json.error.code, 'VALIDATION_ERROR');

    const { status, json } = await api('PUT', doc, { token: tokens.student, body: { requirements: REQUIREMENTS } });
    assert.equal(status, 200);
    assert.deepEqual(json.document.requirements.map((item) => item.code), ['EF-01', 'US-01']);
    assert.deepEqual(json.document.requirements[1].acceptanceCriteria, REQUIREMENTS[1].acceptanceCriteria);
  });

  await t.test('évaluer un brouillon est refusé', async () => {
    const { status, json } = await api('POST', `${doc}/evaluate`, { token: tokens.student });
    assert.equal(status, 409);
    assert.equal(json.error.code, 'CONFLICT');
  });

  await t.test('submit crée la version 1 et verrouille le document', async () => {
    assert.equal((await api('POST', `${doc}/submit`, { token: tokens.teacher })).status, 403);
    const { status, json } = await api('POST', `${doc}/submit`, { token: tokens.student });
    assert.equal(status, 200);
    assert.equal(json.document.status, 'SUBMITTED');
    assert.equal(json.document.currentVersion, 1);

    assert.equal((await api('PUT', doc, { token: tokens.student, body: { requirements: [] } })).status, 409);
    assert.equal((await api('POST', `${doc}/submit`, { token: tokens.student })).status, 409);
  });

  let evaluationId;
  await t.test('evaluate note la version 1 sans révéler le besoin caché', async () => {
    assert.equal((await api('POST', `${doc}/evaluate`, { token: tokens.teacher })).status, 403);
    const { status, json, text } = await api('POST', `${doc}/evaluate`, { token: tokens.student });
    assert.equal(status, 201);
    evaluationId = json.evaluation.id;
    assert.equal(json.evaluation.version, 1);
    assert.equal(json.evaluation.criteria.length, 6);
    assert.equal(json.evaluation.globalScore, json.evaluation.criteria.reduce((sum, criterion) => sum + criterion.score, 0));
    const [coverage, constraints] = json.evaluation.criteria;
    assert.ok(coverage.matching.points.length > 0, 'matching du besoin caché joint au critère de couverture');
    assert.ok(Array.isArray(constraints.matching.points));
    for (const point of [...coverage.matching.points, ...constraints.matching.points]) {
      assert.deepEqual(Object.keys(point).sort(), ['confidence', 'id', 'requirementCodes', 'status'], 'aucun texte de point');
    }
    assertNoSecret(text, secrets);

    const document = await api('GET', doc, { token: tokens.student });
    assert.equal(document.json.document.status, 'EVALUATED');
    assert.equal((await api('POST', `${doc}/evaluate`, { token: tokens.student })).status, 409, 'une seule évaluation par version');
  });

  await t.test('GET /evaluations renvoie l\'historique (propriétaire et enseignant)', async () => {
    for (const token of [tokens.student, tokens.teacher]) {
      const { status, json, text } = await api('GET', `${doc}/evaluations`, { token });
      assert.equal(status, 200);
      assert.deepEqual(json.evaluations.map((evaluation) => evaluation.id), [evaluationId]);
      assertNoSecret(text, secrets);
    }
  });

  const pending = await createChangeRequest(session.id);
  const accepted = await createChangeRequest(session.id, { status: 'ANSWERED', decision: 'ACCEPT', title: 'Paiement en ligne' });
  const refused = await createChangeRequest(session.id, { status: 'ANSWERED', decision: 'REFUSE' });
  const otherSession = await prisma.trainingSession.findFirst({ where: { id: { not: session.id } } });
  const foreign = await createChangeRequest(otherSession.id, { status: 'ANSWERED', decision: 'ACCEPT' });
  t.after(() => prisma.changeRequest.delete({ where: { id: foreign.id } }).catch(() => {}));

  const newVersion = (changeRequestId, token = tokens.student) =>
    api('POST', `${doc}/versions`, {
      token,
      body: {
        changeRequestId,
        reason: 'Intégration de la demande de changement',
        requirements: [...REQUIREMENTS, { ...REQUIREMENTS[0], code: 'EF-02', title: 'Paiement en ligne', priority: 'SHOULD' }],
      },
    });

  await t.test('POST /versions vérifie la demande de changement côté serveur', async () => {
    assert.equal((await newVersion(accepted.id, tokens.teacher)).status, 403);
    assert.equal((await newVersion('inexistante')).status, 404);
    assert.equal((await newVersion(foreign.id)).status, 404, 'demande d\'une autre séance');
    assert.equal((await newVersion(pending.id)).status, 409, 'demande en attente');
    assert.equal((await newVersion(refused.id)).status, 409, 'demande refusée');
  });

  await t.test('POST /versions crée la version 2 et rouvre l\'évaluation', async () => {
    const { status, json, text } = await newVersion(accepted.id);
    assert.equal(status, 201);
    assert.equal(json.version.version, 2);
    assert.equal(json.version.changeRequest.title, 'Paiement en ligne');
    assert.equal(json.version.snapshot.length, 3);
    assertNoSecret(text, secrets);

    const document = await api('GET', doc, { token: tokens.student });
    assert.equal(document.json.document.status, 'SUBMITTED');
    assert.equal(document.json.document.currentVersion, 2);
    assert.equal(document.json.document.requirements.length, 3);

    assert.equal((await newVersion(accepted.id)).status, 409, 'une demande ne crée qu\'une version');

    const evaluation = await api('POST', `${doc}/evaluate`, { token: tokens.student });
    assert.equal(evaluation.status, 201);
    assert.equal(evaluation.json.evaluation.version, 2);
  });

  await t.test('GET /versions liste les versions, filtrables par demande de changement', async () => {
    const all = await api('GET', `${doc}/versions`, { token: tokens.teacher });
    assert.equal(all.status, 200);
    assert.deepEqual(all.json.versions.map((version) => version.version), [2, 1]);
    assert.ok(all.json.versions.every((version) => !('snapshot' in version)), 'la liste est allégée');
    assert.deepEqual(all.json.versions.map((version) => version.requirementsCount), [3, 2]);
    assert.ok(all.json.versions.every((version) => typeof version.globalScore === 'number'));

    const filtered = await api('GET', `${doc}/versions?changeRequestId=${accepted.id}`, { token: tokens.student });
    assert.deepEqual(filtered.json.versions.map((version) => version.version), [2]);
    assert.equal(filtered.json.versions[0].changeRequest.id, accepted.id);
  });

  await t.test('GET /versions/:version renvoie le contenu figé', async () => {
    const first = await api('GET', `${doc}/versions/1`, { token: tokens.student });
    assert.equal(first.status, 200);
    assert.equal(first.json.version.changeRequestId, null);
    assert.deepEqual(first.json.version.snapshot.map((item) => item.code), ['EF-01', 'US-01']);
    assertNoSecret(first.text, secrets);

    assert.equal((await api('GET', `${doc}/versions/9`, { token: tokens.student })).status, 404);
    assert.equal((await api('GET', `${doc}/versions/abc`, { token: tokens.student })).status, 400);
    assert.equal((await api('GET', `${doc}/versions/1`, { token: tokens.other })).status, 403);
  });

  await t.test('le filet de sécurité responseGuard n\'a jamais eu à intervenir', () => {
    assert.deepEqual(guardAlerts, []);
  });
});
