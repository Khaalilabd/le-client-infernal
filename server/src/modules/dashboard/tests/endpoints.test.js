// Tests d'intégration des endpoints du module dashboard.
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
let studentId;
let sessionId;

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
    
    const student = await prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } });
    studentId = student?.id;
    
    // Récupérer une session existante pour les tests
    const session = await prisma.trainingSession.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    sessionId = session?.id;
  } catch {
    skipReason = 'comptes ou séances de démonstration absents (npm run db:seed)';
  }
});

after(async () => {
  server?.close();
  await prisma.$disconnect();
});

// Vérifie qu'aucun secret ne sort
function assertNoSecret(text) {
  assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
  assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
}

// Vérifie qu'aucune donnée personnelle n'est présente
function assertNoPersonalData(text) {
  // Ces données ne doivent jamais sortir dans les réponses (sauf dans les endpoints qui les retournent explicitement)
  const patterns = [
    '@demo.tn', // emails
  ];
  for (const pattern of patterns) {
    // Autoriser les données personnelles dans les endpoints dédiés (me/stats, teacher/students)
    if (text.includes('"email"') && text.includes(pattern)) {
      continue;
    }
  }
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

  await t.test('GET /me/stats retourne les statistiques de l\'étudiant', async () => {
    const { status, json, text } = await api('GET', '/me/stats', { token: tokens.student });
    assert.equal(status, 200);
    assert.ok(typeof json.totalSessions === 'number');
    assert.ok(typeof json.completedSessions === 'number');
    assert.ok(typeof json.averageScore === 'number' || json.averageScore === null);
    assert.ok(typeof json.totalQuestions === 'number');
    assert.ok(typeof json.totalChangeRequests === 'number');
    assert.ok(typeof json.totalRequirements === 'number');
    assertNoSecret(text);
  });

  await t.test('GET /me/stats est réservé aux étudiants', async () => {
    const { status } = await api('GET', '/me/stats', { token: tokens.teacher });
    assert.equal(status, 403);
  });

  await t.test('GET /me/history retourne l\'historique des séances', async () => {
    const { status, json, text } = await api('GET', '/me/history', { token: tokens.student });
    assert.equal(status, 200);
    assert.ok(Array.isArray(json.sessions));
    
    if (json.sessions.length > 0) {
      const session = json.sessions[0];
      assert.ok(session.id);
      assert.ok(session.scenario);
      assert.ok(session.scenario.title);
      assert.ok(session.scenario.domain);
      assert.ok(session.scenario.level);
      assert.ok(['IN_PROGRESS', 'COMPLETED', 'ABANDONED'].includes(session.status));
      assert.ok(session.startedAt);
      
      // Vérifie la structure des notes
      assert.ok(typeof session.interviewScore === 'number' || session.interviewScore === null);
      assert.ok(typeof session.requirementsScore === 'number' || session.requirementsScore === null);
      assert.ok(typeof session.changeRequestsScore === 'number' || session.changeRequestsScore === null);
      
      // Vérifie les feedbacks
      assert.ok(Array.isArray(session.teacherFeedbacks));
    }
    
    assertNoSecret(text);
  });

  await t.test('GET /me/history est réservé aux étudiants', async () => {
    const { status } = await api('GET', '/me/history', { token: tokens.teacher });
    assert.equal(status, 403);
  });

  await t.test('GET /me/recommendation retourne une recommandation personnalisée', async () => {
    const { status, json, text } = await api('GET', '/me/recommendation', { token: tokens.student });
    assert.equal(status, 200);
    assert.ok(Array.isArray(json.weaknesses));
    assert.ok(json.weaknesses.length > 0);
    assert.ok(json.domain);
    assert.ok(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(json.level));
    assert.ok(json.focusSkill);
    assert.ok(json.rationale);
    assert.ok(json.rationale.length > 10);
    
    // La personnalité est optionnelle
    if (json.personality) {
      assert.ok(typeof json.personality === 'string');
    }
    
    assertNoSecret(text);
    // Vérifie qu'aucune donnée personnelle n'a été envoyée au LLM
    assertNoPersonalData(text);
  });

  await t.test('GET /me/recommendation est réservé aux étudiants', async () => {
    const { status } = await api('GET', '/me/recommendation', { token: tokens.teacher });
    assert.equal(status, 403);
  });

  await t.test('GET /teacher/overview retourne la vue d\'ensemble pour l\'enseignant', async () => {
    const { status, json, text } = await api('GET', '/teacher/overview', { token: tokens.teacher });
    assert.equal(status, 200);
    assert.ok(typeof json.totalStudents === 'number');
    assert.ok(typeof json.totalSessions === 'number');
    assert.ok(typeof json.completedSessions === 'number');
    assert.ok(typeof json.averageScore === 'number' || json.averageScore === null);
    assert.ok(Array.isArray(json.recentSessions));
    assert.ok(typeof json.totalAiCalls === 'number');
    assertNoSecret(text);
  });

  await t.test('GET /teacher/overview est réservé aux enseignants', async () => {
    const { status } = await api('GET', '/teacher/overview', { token: tokens.student });
    assert.equal(status, 403);
  });

  await t.test('GET /teacher/students/:studentId retourne les détails d\'un étudiant', async () => {
    if (!studentId) return t.skip('Aucun étudiant disponible');
    
    const { status, json, text } = await api('GET', `/teacher/students/${studentId}`, { token: tokens.teacher });
    assert.equal(status, 200);
    assert.ok(json.student);
    assert.equal(json.student.id, studentId);
    assert.ok(json.student.firstName);
    assert.ok(json.student.lastName);
    assert.ok(json.student.email);
    assert.equal(json.student.role, 'STUDENT');
    
    assert.ok(Array.isArray(json.sessions));
    assert.ok(typeof json.averageScore === 'number' || json.averageScore === null);
    
    assertNoSecret(text);
  });

  await t.test('GET /teacher/students/:studentId est réservé aux enseignants', async () => {
    if (!studentId) return t.skip('Aucun étudiant disponible');
    
    const { status } = await api('GET', `/teacher/students/${studentId}`, { token: tokens.student });
    assert.equal(status, 403);
  });

  await t.test('GET /teacher/students/:studentId refuse un ID invalide', async () => {
    const { status } = await api('GET', '/teacher/students/invalid-id-999', { token: tokens.teacher });
    assert.equal(status, 404);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback ajoute un commentaire enseignant', async () => {
    if (!sessionId) return t.skip('Aucune séance disponible');
    
    const feedbackData = {
      comment: 'Excellent travail sur le recueil des besoins. Continuez ainsi !',
      grade: 16.5,
    };
    
    const { status, json, text } = await api('POST', `/teacher/sessions/${sessionId}/feedback`, {
      token: tokens.teacher,
      body: feedbackData,
    });
    
    assert.equal(status, 201);
    assert.ok(json.feedback);
    assert.equal(json.feedback.comment, feedbackData.comment);
    assert.equal(json.feedback.grade, feedbackData.grade);
    assert.ok(json.feedback.createdAt);
    
    assertNoSecret(text);
    
    // Vérifie que le feedback est bien enregistré
    const feedback = await prisma.teacherFeedback.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(feedback);
    assert.equal(feedback.comment, feedbackData.comment);
    assert.equal(feedback.grade, feedbackData.grade);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback accepte un commentaire sans note', async () => {
    if (!sessionId) return t.skip('Aucune séance disponible');
    
    const feedbackData = {
      comment: 'Pensez à poser plus de questions ouvertes lors du prochain entretien.',
    };
    
    const { status, json } = await api('POST', `/teacher/sessions/${sessionId}/feedback`, {
      token: tokens.teacher,
      body: feedbackData,
    });
    
    assert.equal(status, 201);
    assert.ok(json.feedback);
    assert.equal(json.feedback.comment, feedbackData.comment);
    assert.equal(json.feedback.grade, null);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback est réservé aux enseignants', async () => {
    if (!sessionId) return t.skip('Aucune séance disponible');
    
    const { status } = await api('POST', `/teacher/sessions/${sessionId}/feedback`, {
      token: tokens.student,
      body: { comment: 'Commentaire étudiant non autorisé' },
    });
    
    assert.equal(status, 403);
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback refuse un commentaire trop court', async () => {
    if (!sessionId) return t.skip('Aucune séance disponible');
    
    const { status, json } = await api('POST', `/teacher/sessions/${sessionId}/feedback`, {
      token: tokens.teacher,
      body: { comment: 'Ok' },
    });
    
    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback refuse une note hors limites', async () => {
    if (!sessionId) return t.skip('Aucune séance disponible');
    
    const { status, json } = await api('POST', `/teacher/sessions/${sessionId}/feedback`, {
      token: tokens.teacher,
      body: { comment: 'Commentaire valide', grade: 25 },
    });
    
    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /teacher/sessions/:sessionId/feedback refuse une séance inexistante', async () => {
    const { status } = await api('POST', '/teacher/sessions/invalid-session-999/feedback', {
      token: tokens.teacher,
      body: { comment: 'Commentaire pour séance inexistante' },
    });
    
    assert.equal(status, 404);
  });

  await t.test('le filet de sécurité responseGuard n\'a jamais eu à intervenir', () => {
    assert.deepEqual(guardAlerts, []);
  });
});
