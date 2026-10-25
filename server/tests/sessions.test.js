// Tests de la fin de séance et de la note finale (base commune).
// La partie intégration nécessite la base de démonstration (npm run db:up && npm run db:seed).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';

const { interviewScore, weightedFinalScore, SCORE_WEIGHTS } = await import('../src/shared/sessions/sessionScore.js');
const { createApp } = await import('../src/app.js');
const { prisma } = await import('../src/shared/db/prisma.js');

// ---------- Règle de calcul ----------

test('la note d\'entretien retient les 3 meilleures questions', () => {
  assert.equal(interviewScore([0.2, 0.8, 0.4, 0.9, 0.1]), 70);
  assert.equal(interviewScore([0.5]), 50);
  assert.equal(interviewScore([]), null);
});

test('la note finale pondère les notes disponibles (30 / 50 / 20)', () => {
  assert.deepEqual(SCORE_WEIGHTS, { interview: 0.3, requirements: 0.5, changeRequests: 0.2 });
  assert.equal(weightedFinalScore({ interview: 60, requirements: 80, changeRequests: 70 }), 72);
  // Sans demande de changement : les poids 30 et 50 sont répartis sur 80
  assert.equal(weightedFinalScore({ interview: 60, requirements: 80, changeRequests: null }), 72.5);
  assert.equal(weightedFinalScore({ interview: null, requirements: null, changeRequests: null }), null);
});

// ---------- Endpoint PATCH /api/sessions/:id/status ----------

let server;
let baseUrl;
let skipReason = null;
let token;
const createdSessions = [];

before(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    skipReason = 'base de données inaccessible (npm run db:up)';
    return;
  }
  server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'etudiant1@demo.tn', password: 'Password123!' }),
  });
  if (!response.ok) skipReason = 'comptes de démonstration absents (npm run db:seed)';
  else token = (await response.json()).token;
});

after(async () => {
  if (createdSessions.length) await prisma.trainingSession.deleteMany({ where: { id: { in: createdSessions } } });
  server?.close();
  await prisma.$disconnect();
});

/** Séance de test dédiée, avec ou sans cahier des charges évalué. */
async function createTestSession({ evaluated }) {
  const student = await prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } });
  const scenario = await prisma.scenario.findFirst({ orderBy: { createdAt: 'asc' } });
  const session = await prisma.trainingSession.create({ data: { studentId: student.id, scenarioId: scenario.id } });
  createdSessions.push(session.id);
  await prisma.interviewMessage.createMany({
    data: [0.4, 0.8, 0.6, 0.2].map((proximity) => ({ sessionId: session.id, sender: 'STUDENT', content: 'Question ?', proximity })),
  });
  await prisma.changeRequest.create({
    data: { sessionId: session.id, title: 'Test', description: 'Test', reason: 'Test', impact: {}, status: 'ANSWERED', decision: 'NEGOTIATE', score: 70 },
  });
  if (evaluated) {
    await prisma.requirementsDocument.create({
      data: {
        sessionId: session.id,
        evaluations: { create: { globalScore: 80, criteria: [], feedback: 'Test', missingPoints: [], version: 1 } },
      },
    });
  }
  return session.id;
}

const patchStatus = (sessionId, status) =>
  fetch(`${baseUrl}/api/sessions/${sessionId}/status`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(async (response) => ({ status: response.status, json: await response.json() }));

test('terminer une séance calcule et enregistre la note finale', async (t) => {
  if (skipReason) return t.skip(skipReason);

  await t.test('refusé tant que le cahier des charges n\'est pas évalué (409)', async () => {
    const sessionId = await createTestSession({ evaluated: false });
    const { status, json } = await patchStatus(sessionId, 'COMPLETED');
    assert.equal(status, 409);
    assert.equal(json.error.code, 'REQUIREMENTS_NOT_EVALUATED');
  });

  await t.test('note finale = 30 % entretien + 50 % cahier + 20 % changements', async () => {
    const sessionId = await createTestSession({ evaluated: true });
    const { status, json } = await patchStatus(sessionId, 'COMPLETED');
    assert.equal(status, 200);
    assert.equal(json.session.status, 'COMPLETED');
    // entretien : moyenne de 0,8 / 0,6 / 0,4 = 60 ; cahier 80 ; changements 70 -> 72
    assert.equal(json.session.finalScore, 72);
    assert.ok(!JSON.stringify(json).includes('hiddenNeed'));

    const again = await patchStatus(sessionId, 'ABANDONED');
    assert.equal(again.status, 409, 'une séance terminée ne change plus de statut');
  });

  await t.test('abandonner une séance ne donne pas de note', async () => {
    const sessionId = await createTestSession({ evaluated: false });
    const { status, json } = await patchStatus(sessionId, 'ABANDONED');
    assert.equal(status, 200);
    assert.equal(json.session.status, 'ABANDONED');
    assert.equal(json.session.finalScore, null);
  });
});
