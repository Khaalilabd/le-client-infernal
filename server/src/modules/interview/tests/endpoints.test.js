// Tests d'intégration des endpoints du module interview.
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
let sessionId;

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}/api/interview${path}`, {
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
    // Séance dédiée au test (supprimée à la fin) : le test ne modifie pas les séances
    // de démonstration utilisées par les tests des autres modules, lancés en parallèle.
    const student = await prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } });
    const scenario = await prisma.scenario.findFirst({ orderBy: { createdAt: 'asc' } });
    if (student && scenario) {
      sessionId = (await prisma.trainingSession.create({ data: { studentId: student.id, scenarioId: scenario.id } })).id;
    }
  } catch {
    skipReason = 'comptes ou séances de démonstration absents (npm run db:seed)';
  }
});

after(async () => {
  if (sessionId) await prisma.trainingSession.delete({ where: { id: sessionId } }).catch(() => {});
  server?.close();
  await prisma.$disconnect();
});

// Vérifie qu'aucun secret ne sort
function assertNoSecret(text, secrets = []) {
  assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
  assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  for (const secret of secrets) {
    if (secret && secret.length > 10) {
      assert.ok(!text.includes(secret), 'contenu secret présent dans la réponse');
    }
  }
}

test('endpoints du module interview', async (t) => {
  if (skipReason) return t.skip(skipReason);
  if (!sessionId) return t.skip('aucune séance IN_PROGRESS pour étudiant1');

  const guardAlerts = [];
  const originalError = console.error;
  console.error = (...args) => {
    if (String(args[0]).includes('responseGuard')) guardAlerts.push(args[0]);
    else originalError(...args);
  };
  t.after(() => {
    console.error = originalError;
  });

  // Récupère le scénario pour vérifier les secrets plus tard
  const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  const scenario = await getScenarioSecrets(session.scenarioId);
  const secrets = [scenario.hiddenNeed, ...(scenario.implicitConstraints || [])];

  await t.test('authentification obligatoire', async () => {
    assert.equal((await api('GET', `/sessions/${sessionId}/messages`)).status, 401);
  });

  await t.test('GET /sessions/:sessionId/messages', async () => {
    const { status, json, text } = await api('GET', `/sessions/${sessionId}/messages`, { token: tokens.student });
    assert.equal(status, 200);
    assert.ok(Array.isArray(json.messages));
    // Vérifie que proximity n'est pas exposé
    if (json.messages.length > 0) {
      assert.ok(!('proximity' in json.messages[0]), 'proximity ne doit pas être exposé');
    }
    assertNoSecret(text, secrets);
  });

  await t.test('GET /messages refuse l\'accès à une séance d\'un autre étudiant', async () => {
    const otherSession = await prisma.trainingSession.findFirst({
      where: { studentId: { not: session.studentId } },
    });
    if (otherSession) {
      assert.equal((await api('GET', `/sessions/${otherSession.id}/messages`, { token: tokens.student })).status, 403);
    }
  });

  await t.test('POST /sessions/:sessionId/messages envoie une question et reçoit la réponse du client', async () => {
    const { status, json, text } = await api('POST', `/sessions/${sessionId}/messages`, {
      token: tokens.student,
      body: { content: 'Pourquoi avez-vous besoin de cette application ?' },
    });
    assert.equal(status, 201);
    assert.ok(json.studentMessage);
    assert.ok(json.clientMessage);
    assert.equal(json.studentMessage.sender, 'STUDENT');
    assert.equal(json.clientMessage.sender, 'CLIENT');
    assert.ok(json.clientMessage.content.length > 0);
    assertNoSecret(text, secrets);
  });

  await t.test('POST /messages refuse un message vide', async () => {
    const { status, json } = await api('POST', `/sessions/${sessionId}/messages`, {
      token: tokens.student,
      body: { content: '   ' },
    });
    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /messages est réservé à l\'étudiant propriétaire', async () => {
    assert.equal(
      (
        await api('POST', `/sessions/${sessionId}/messages`, {
          token: tokens.teacher,
          body: { content: 'Question de l\'enseignant' },
        })
      ).status,
      403,
    );
  });

  await t.test('GET /sessions/:sessionId/progress retourne le compteur et le niveau de découverte', async () => {
    const { status, json, text } = await api('GET', `/sessions/${sessionId}/progress`, { token: tokens.student });
    assert.equal(status, 200);
    assert.ok(typeof json.questionsCount === 'number');
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(json.discoveryLevel));
    assert.ok(json.recommendedQuestions.min > 0);
    assert.ok(json.recommendedQuestions.max > json.recommendedQuestions.min);
    assertNoSecret(text, secrets);
    // Vérifie qu'on ne renvoie pas la proximity exacte
    assert.ok(!text.includes('proximity'));
  });

  await t.test('POST /sessions/:sessionId/end termine l\'entretien et génère une synthèse', async () => {
    const { status, json, text } = await api('POST', `/sessions/${sessionId}/end`, { token: tokens.student });
    assert.equal(status, 200);
    assert.ok(json.summary);
    assert.ok(Array.isArray(json.summary.discoveredPoints));
    assert.ok(json.summary.discoveredPoints.length > 0);
    assert.ok(typeof json.summary.questionsAsked === 'number');
    assert.ok(json.summary.qualityFeedback.length > 0);
    assertNoSecret(text, secrets);

    // La fin de l'entretien est enregistrée dans InterviewSummary, la séance continue (cahier des charges, changements)
    const updatedSession = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
    assert.equal(updatedSession.status, 'IN_PROGRESS');
    assert.ok(await prisma.interviewSummary.findUnique({ where: { sessionId } }), 'synthèse enregistrée');
  });

  await t.test('GET /summary indique que l\'entretien est terminé, sans secret', async () => {
    const { status, json, text } = await api('GET', `/sessions/${sessionId}/summary`, { token: tokens.student });
    assert.equal(status, 200);
    assert.equal(json.ended, true);
    assert.ok(json.summary);
    assertNoSecret(text, secrets);
  });

  await t.test('POST /end refuse de terminer un entretien déjà terminé (409)', async () => {
    const { status, json } = await api('POST', `/sessions/${sessionId}/end`, { token: tokens.student });
    assert.equal(status, 409);
    assert.ok(json.error.message.includes('terminé'));
  });

  await t.test('POST /messages refuse une question après la fin de l\'entretien (409)', async () => {
    const { status } = await api('POST', `/sessions/${sessionId}/messages`, {
      token: tokens.student,
      body: { content: 'Une dernière question ?' },
    });
    assert.equal(status, 409);
  });

  await t.test('le filet de sécurité responseGuard n\'a jamais eu à intervenir', () => {
    assert.deepEqual(guardAlerts, []);
  });
});
