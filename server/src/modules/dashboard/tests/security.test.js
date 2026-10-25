// Tests de sécurité du module dashboard : données personnelles, besoin caché, rôles et isolation.
// La partie intégration nécessite la base de démonstration (npm run db:up && npm run db:seed).
// Les séances de test sont créées puis supprimées ; les séances de démonstration ne sont pas modifiées.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';

const { createApp } = await import('../../../app.js');
const { prisma } = await import('../../../shared/db/prisma.js');
const { getScenarioSecrets } = await import('../../../shared/db/scenarioSecrets.js');
const { buildAnonymizedHistory } = await import('../dashboard.service.js');
const { RECOMMENDABLE_DOMAINS } = await import('../dashboard.schemas.js');

// ---------- Historique envoyé au LLM ----------

test('l\'historique envoyé au LLM ne contient ni identité ni identifiant', () => {
  const sessions = [
    {
      id: 'session-123',
      status: 'COMPLETED',
      finalScore: 64,
      studentId: 'etudiant-456',
      student: { firstName: 'Yassine', lastName: 'Ferchichi', email: 'etudiant1@demo.tn' },
      scenario: { id: 'scenario-789', domain: 'Santé', level: 'BEGINNER', hiddenNeed: 'Réduire les rendez-vous non honorés' },
      interviewSummary: { questionsCount: 6 },
      changeRequests: [{ score: 70, decision: 'NEGOTIATE' }],
      requirementsDocument: { evaluations: [{ globalScore: 60, criteria: [{ name: 'Couverture du besoin réel', score: 18, maxScore: 30 }] }] },
    },
  ];
  const [entry] = buildAnonymizedHistory(sessions);
  assert.deepEqual(entry, {
    status: 'COMPLETED',
    domain: 'Santé',
    level: 'BEGINNER',
    finalScore: 64,
    interviewQuestions: 6,
    changeRequestsScore: 70,
    changeRequestsDecisions: { ACCEPT: 0, NEGOTIATE: 1, REFUSE: 0 },
    requirementsScore: 60,
    discoveryPercent: 60,
  });
  const sent = JSON.stringify(entry);
  for (const forbidden of ['Yassine', 'Ferchichi', '@demo.tn', 'session-123', 'etudiant-456', 'scenario-789', 'rendez-vous']) {
    assert.ok(!sent.includes(forbidden), `${forbidden} envoyé au LLM`);
  }
});

// ---------- Endpoints ----------

const PASSWORD = 'Password123!';
let server;
let baseUrl;
let skipReason = null;
const tokens = {};
const ids = {};
const createdSessionIds = [];
let secrets = [];

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}/api/dashboard${path}`, {
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

async function createSession(studentId, scenarioId, status) {
  const session = await prisma.trainingSession.create({
    data: { studentId, scenarioId, status, finalScore: status === 'COMPLETED' ? 60 : null, completedAt: status === 'COMPLETED' ? new Date() : null },
  });
  createdSessionIds.push(session.id);
  return session.id;
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
    tokens.student1 = await login('etudiant1@demo.tn');
    tokens.student2 = await login('etudiant2@demo.tn');
    tokens.teacher = await login('enseignant@demo.tn');
    ids.student1 = (await prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } })).id;
    ids.student2 = (await prisma.user.findUnique({ where: { email: 'etudiant2@demo.tn' } })).id;
  } catch {
    skipReason = 'comptes de démonstration absents (npm run db:seed)';
    return;
  }
  const scenario = await prisma.scenario.findFirst({ orderBy: { createdAt: 'asc' } });
  ids.student1Session = await createSession(ids.student1, scenario.id, 'COMPLETED');
  await createSession(ids.student1, scenario.id, 'COMPLETED');
  ids.student2Session = await createSession(ids.student2, scenario.id, 'IN_PROGRESS');
  const secret = await getScenarioSecrets(scenario.id);
  secrets = [secret.hiddenNeed, ...(secret.implicitConstraints ?? [])];
});

after(async () => {
  if (createdSessionIds.length) await prisma.trainingSession.deleteMany({ where: { id: { in: createdSessionIds } } });
  server?.close();
  await prisma.$disconnect();
});

function assertNoSecret(text) {
  assert.ok(!text.includes('hiddenNeed') && !text.includes('implicitConstraints'), 'champ secret présent');
  for (const secret of secrets) assert.ok(!text.includes(secret), 'contenu secret présent');
}

test('tests de sécurité du module dashboard', async (t) => {
  if (skipReason) return t.skip(skipReason);

  await t.test('le besoin caché ne sort d\'aucun endpoint', async () => {
    const calls = [
      ['/me/stats', tokens.student1],
      ['/me/history', tokens.student1],
      ['/me/recommendation', tokens.student1],
      [`/sessions/${ids.student1Session}/report`, tokens.student1],
      ['/teacher/overview', tokens.teacher],
      [`/teacher/students/${ids.student1}`, tokens.teacher],
    ];
    for (const [path, token] of calls) {
      const { status, text } = await api('GET', path, { token });
      assert.equal(status, 200, path);
      assertNoSecret(text);
    }
  });

  await t.test('Contrôle des rôles : un étudiant n\'accède pas aux endpoints enseignant', async () => {
    assert.equal((await api('GET', '/teacher/overview', { token: tokens.student1 })).status, 403);
    assert.equal((await api('GET', `/teacher/students/${ids.student2}`, { token: tokens.student1 })).status, 403);
    const feedback = await api('POST', `/teacher/sessions/${ids.student1Session}/feedback`, {
      token: tokens.student1,
      body: { comment: 'Je me note moi-même.', grade: 20 },
    });
    assert.equal(feedback.status, 403);
  });

  await t.test('Contrôle des rôles : un enseignant n\'accède pas aux endpoints étudiant', async () => {
    for (const path of ['/me/stats', '/me/history', '/me/recommendation']) {
      assert.equal((await api('GET', path, { token: tokens.teacher })).status, 403, path);
    }
  });

  await t.test('Isolation des données : chaque étudiant ne voit que ses séances', async () => {
    const { json } = await api('GET', '/me/history', { token: tokens.student2 });
    assert.ok(json.sessions.some((session) => session.id === ids.student2Session));
    assert.ok(!json.sessions.some((session) => session.id === ids.student1Session), 'étudiant2 voit une séance d\'étudiant1');
    const report = await api('GET', `/sessions/${ids.student1Session}/report`, { token: tokens.student2 });
    assert.equal(report.status, 403);
  });

  await t.test('Un enseignant voit tous les étudiants et commente n\'importe quelle séance', async () => {
    const { json } = await api('GET', '/teacher/overview', { token: tokens.teacher });
    const listed = json.overview.students.map((student) => student.id);
    assert.ok(listed.includes(ids.student1) && listed.includes(ids.student2));
    const feedback = await api('POST', `/teacher/sessions/${ids.student2Session}/feedback`, {
      token: tokens.teacher,
      body: { comment: 'Retour de test sur une séance en cours.' },
    });
    assert.equal(feedback.status, 201);
  });

  await t.test('La recommandation repose sur l\'historique de l\'étudiant connecté', async () => {
    // étudiant1 : au moins 2 séances terminées -> analyse par l'IA ; étudiant2 : 1 seule -> règle simple
    const rec1 = await api('GET', '/me/recommendation', { token: tokens.student1 });
    const rec2 = await api('GET', '/me/recommendation', { token: tokens.student2 });
    assert.equal(rec1.json.recommendation.source, 'AI');
    assert.equal(rec2.json.recommendation.source, 'RULE');
    for (const { recommendation } of [rec1.json, rec2.json]) {
      assert.ok(RECOMMENDABLE_DOMAINS.includes(recommendation.domain), recommendation.domain);
    }
  });

  await t.test('Validation des entrées : paramètres et corps invalides', async () => {
    const empty = await api('POST', `/teacher/sessions/${ids.student1Session}/feedback`, { token: tokens.teacher, body: {} });
    assert.equal(empty.status, 400);
    const notNumber = await api('POST', `/teacher/sessions/${ids.student1Session}/feedback`, {
      token: tokens.teacher,
      body: { comment: 'Note en texte.', grade: 'quinze' },
    });
    assert.equal(notNumber.status, 400);
  });
});
