// Tests d'intégration des endpoints du module dashboard.
// Nécessitent la base de démonstration (npm run db:up && npm run db:seed) ;
// ils sont ignorés automatiquement si la base est inaccessible.
// Les données de test (2 séances terminées et 1 en cours pour étudiant1) sont créées puis supprimées :
// les tests ne dépendent pas des séances de démonstration et ne les modifient pas.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';

const { createApp } = await import('../../../app.js');
const { prisma } = await import('../../../shared/db/prisma.js');

const PASSWORD = 'Password123!';
let server;
let baseUrl;
let skipReason = null;
const tokens = {};
let studentId;
const testSessions = {};
const createdSessionIds = [];

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

/** Séance de test : entretien, une demande de changement traitée et un cahier évalué. */
async function createSession(scenario, { status, finalScore, discovery }) {
  const session = await prisma.trainingSession.create({
    data: { studentId, scenarioId: scenario.id, status, finalScore, completedAt: status === 'COMPLETED' ? new Date() : null },
  });
  createdSessionIds.push(session.id);
  await prisma.interviewMessage.createMany({
    data: [0.3, 0.7].map((proximity) => ({ sessionId: session.id, sender: 'STUDENT', content: 'Question ?', proximity })),
  });
  await prisma.interviewSummary.create({ data: { sessionId: session.id, summary: {}, questionsCount: 2 } });
  await prisma.changeRequest.create({
    data: { sessionId: session.id, title: 'Test', description: 'Test', reason: 'Test', impact: {}, status: 'ANSWERED', decision: 'ACCEPT', score: 50 },
  });
  await prisma.requirementsDocument.create({
    data: {
      sessionId: session.id,
      evaluations: {
        create: {
          globalScore: 55,
          criteria: [{ name: 'Couverture du besoin réel', score: discovery, maxScore: 30, comment: 'Test' }],
          feedback: 'Test',
          missingPoints: [],
          version: 1,
        },
      },
    },
  });
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
    tokens.student = await login('etudiant1@demo.tn');
    tokens.otherStudent = await login('etudiant2@demo.tn');
    tokens.teacher = await login('enseignant@demo.tn');
    studentId = (await prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } })).id;
  } catch {
    skipReason = 'comptes de démonstration absents (npm run db:seed)';
    return;
  }
  const [first, second] = await prisma.scenario.findMany({ orderBy: { createdAt: 'asc' }, take: 2 });
  testSessions.completed1 = await createSession(first, { status: 'COMPLETED', finalScore: 52, discovery: 9 });
  testSessions.completed2 = await createSession(second, { status: 'COMPLETED', finalScore: 58, discovery: 15 });
  testSessions.inProgress = await createSession(first, { status: 'IN_PROGRESS', finalScore: null, discovery: 12 });
});

after(async () => {
  if (createdSessionIds.length) await prisma.trainingSession.deleteMany({ where: { id: { in: createdSessionIds } } });
  server?.close();
  await prisma.$disconnect();
});

// Vérifie qu'aucun secret ne sort
function assertNoSecret(text) {
  assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
  assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  assert.ok(!text.includes('proximity'), 'proximité individuelle présente dans la réponse');
}

test('endpoints du module dashboard', async (t) => {
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
    assert.equal((await api('GET', '/me/stats')).status, 401);
    assert.equal((await api('GET', '/me/history')).status, 401);
    assert.equal((await api('GET', '/me/recommendation')).status, 401);
    assert.equal((await api('GET', '/teacher/overview')).status, 401);
  });

  await t.test('GET /me/stats retourne les statistiques, les compétences et la progression', async () => {
    const { status, json, text } = await api('GET', '/me/stats', { token: tokens.student });
    assert.equal(status, 200);
    const { stats } = json;
    assert.ok(stats.sessions.total >= 3);
    assert.ok(stats.sessions.completed >= 2);
    assert.ok(typeof stats.averageFinalScore === 'number');
    assert.ok(stats.interviewMessages >= 6);
    // Compétences en % : découverte (critère du module 4), exigences, changements
    for (const skill of ['discovery', 'requirements', 'changes']) assert.ok(typeof stats.skills[skill] === 'number', skill);
    // Progression : séances terminées dans l'ordre chronologique
    const ours = stats.progression.filter((point) => [testSessions.completed1, testSessions.completed2].includes(point.sessionId));
    assert.deepEqual(ours.map((point) => point.finalScore), [52, 58]);
    assertNoSecret(text);
  });

  await t.test('GET /me/stats est réservé aux étudiants', async () => {
    assert.equal((await api('GET', '/me/stats', { token: tokens.teacher })).status, 403);
  });

  await t.test('GET /me/history retourne l\'historique des séances avec les notes', async () => {
    const { status, json, text } = await api('GET', '/me/history', { token: tokens.student });
    assert.equal(status, 200);
    const session = json.sessions.find((item) => item.id === testSessions.completed1);
    assert.ok(session, 'séance de test absente');
    assert.ok(session.scenario.title && session.scenario.domain && session.scenario.level);
    assert.equal(session.status, 'COMPLETED');
    assert.equal(session.finalScore, 52);
    assert.deepEqual(session.scores, { interviewQuestions: 2, changeRequests: 50, requirements: 55 });
    assert.ok(Array.isArray(session.feedbacks));
    assertNoSecret(text);
  });

  await t.test('GET /me/history est réservé aux étudiants', async () => {
    assert.equal((await api('GET', '/me/history', { token: tokens.teacher })).status, 403);
  });

  await t.test('GET /me/recommendation analyse l\'historique avec l\'IA (Few-shot)', async () => {
    const { status, json, text } = await api('GET', '/me/recommendation', { token: tokens.student });
    assert.equal(status, 200);
    const { recommendation } = json;
    assert.equal(recommendation.source, 'AI', 'au moins 2 séances terminées : le LLM doit être appelé');
    assert.ok(recommendation.weaknesses.length > 0);
    assert.ok(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(recommendation.level));
    assert.ok(recommendation.focusSkill && recommendation.rationale.length > 10);
    assertNoSecret(text);
  });

  await t.test('GET /me/recommendation est réservé aux étudiants', async () => {
    assert.equal((await api('GET', '/me/recommendation', { token: tokens.teacher })).status, 403);
  });

  await t.test('GET /sessions/:sessionId/report donne le bilan de la séance', async () => {
    const { status, json, text } = await api('GET', `/sessions/${testSessions.inProgress}/report`, { token: tokens.student });
    assert.equal(status, 200);
    assert.equal(json.session.status, 'IN_PROGRESS');
    // entretien : moyenne de 0,7 et 0,3 = 50 ; cahier 55 ; changements 50 -> note provisoire 52,5
    assert.deepEqual(json.breakdown.components, { interview: 50, requirements: 55, changeRequests: 50 });
    assert.equal(json.breakdown.finalScore, 52.5);
    assertNoSecret(text);
  });

  await t.test('GET /sessions/:sessionId/report : propriétaire ou enseignant uniquement', async () => {
    assert.equal((await api('GET', `/sessions/${testSessions.inProgress}/report`, { token: tokens.otherStudent })).status, 403);
    assert.equal((await api('GET', `/sessions/${testSessions.inProgress}/report`, { token: tokens.teacher })).status, 200);
    assert.equal((await api('GET', '/sessions/inexistante/report', { token: tokens.student })).status, 404);
  });

  await t.test('GET /teacher/overview retourne la vue d\'ensemble et la liste des étudiants', async () => {
    const { status, json, text } = await api('GET', '/teacher/overview', { token: tokens.teacher });
    assert.equal(status, 200);
    const { overview } = json;
    assert.ok(overview.counts.students >= 2);
    assert.ok(overview.recentSessions.length > 0);
    const student = overview.students.find((item) => item.id === studentId);
    assert.ok(student.sessions >= 3 && student.completed >= 2);
    assertNoSecret(text);
  });

  await t.test('GET /teacher/overview est réservé aux enseignants', async () => {
    assert.equal((await api('GET', '/teacher/overview', { token: tokens.student })).status, 403);
  });

  await t.test('GET /teacher/students/:studentId retourne la fiche d\'un étudiant', async () => {
    const { status, json, text } = await api('GET', `/teacher/students/${studentId}`, { token: tokens.teacher });
    assert.equal(status, 200);
    assert.equal(json.student.id, studentId);
    assert.equal(json.student.role, 'STUDENT');
    assert.ok(json.student.firstName && json.student.lastName && json.student.email);
    const session = json.sessions.find((item) => item.id === testSessions.completed2);
    assert.equal(session.breakdown.components.requirements, 55);
    assert.ok(typeof json.averageFinalScore === 'number');
    assertNoSecret(text);
  });

  await t.test('GET /teacher/students/:studentId est réservé aux enseignants', async () => {
    assert.equal((await api('GET', `/teacher/students/${studentId}`, { token: tokens.student })).status, 403);
  });

  await t.test('GET /teacher/students/:studentId : étudiant inconnu ou enseignant -> 404', async () => {
    const unknown = await api('GET', '/teacher/students/inexistant', { token: tokens.teacher });
    assert.equal(unknown.status, 404);
    assert.equal(unknown.json.error.code, 'NOT_FOUND');
    const teacher = await prisma.user.findUnique({ where: { email: 'enseignant@demo.tn' } });
    assert.equal((await api('GET', `/teacher/students/${teacher.id}`, { token: tokens.teacher })).status, 404);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback ajoute un commentaire visible par l\'étudiant', async () => {
    const { status, json } = await api('POST', `/teacher/sessions/${testSessions.completed1}/feedback`, {
      token: tokens.teacher,
      body: { comment: 'Bon entretien, pensez aux contraintes de sécurité.', grade: 15.5 },
    });
    assert.equal(status, 201);
    assert.equal(json.feedback.grade, 15.5);
    assert.ok(json.feedback.teacher.firstName);

    const history = await api('GET', '/me/history', { token: tokens.student });
    const session = history.json.sessions.find((item) => item.id === testSessions.completed1);
    assert.equal(session.feedbacks[0].comment, 'Bon entretien, pensez aux contraintes de sécurité.');
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback accepte un commentaire sans note', async () => {
    const { status, json } = await api('POST', `/teacher/sessions/${testSessions.completed2}/feedback`, {
      token: tokens.teacher,
      body: { comment: 'Commentaire sans note.' },
    });
    assert.equal(status, 201);
    assert.equal(json.feedback.grade, null);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback est réservé aux enseignants', async () => {
    const { status } = await api('POST', `/teacher/sessions/${testSessions.completed1}/feedback`, {
      token: tokens.student,
      body: { comment: 'Je me note moi-même.' },
    });
    assert.equal(status, 403);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback refuse un commentaire trop court ou une note hors limites', async () => {
    const short = await api('POST', `/teacher/sessions/${testSessions.completed1}/feedback`, { token: tokens.teacher, body: { comment: 'Bof' } });
    assert.equal(short.status, 400);
    const grade = await api('POST', `/teacher/sessions/${testSessions.completed1}/feedback`, {
      token: tokens.teacher,
      body: { comment: 'Note impossible.', grade: 25 },
    });
    assert.equal(grade.status, 400);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback refuse une séance inexistante (404)', async () => {
    const { status, json } = await api('POST', '/teacher/sessions/inexistante/feedback', {
      token: tokens.teacher,
      body: { comment: 'Commentaire pour séance inexistante' },
    });
    assert.equal(status, 404);
    assert.equal(json.error.code, 'NOT_FOUND');
  });

  await t.test('le filet de sécurité responseGuard n\'a jamais eu à intervenir', () => {
    assert.deepEqual(guardAlerts, []);
  });
});
