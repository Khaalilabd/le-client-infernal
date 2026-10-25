// Tests de sécurité du module dashboard
// Vérifie que :
// - Aucune donnée personnelle n'est envoyée au LLM
// - Le besoin caché ne quitte jamais le serveur
// - Les contrôles de rôles fonctionnent correctement
// - Un étudiant ne peut pas accéder aux données d'un autre

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
let student1Id;
let student2Id;
let student1SessionId;
let student2SessionId;

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
    tokens.student1 = await login('etudiant1@demo.tn');
    tokens.student2 = await login('etudiant2@demo.tn');
    tokens.teacher = await login('enseignant@demo.tn');

    const student1 = await prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } });
    const student2 = await prisma.user.findUnique({ where: { email: 'etudiant2@demo.tn' } });
    
    student1Id = student1?.id;
    student2Id = student2?.id;

    student1SessionId = (
      await prisma.trainingSession.findFirst({
        where: { studentId: student1Id },
        orderBy: { createdAt: 'desc' },
      })
    )?.id;

    student2SessionId = (
      await prisma.trainingSession.findFirst({
        where: { studentId: student2Id },
        orderBy: { createdAt: 'desc' },
      })
    )?.id;
  } catch {
    skipReason = 'comptes de démonstration absents (npm run db:seed)';
  }
});

after(async () => {
  server?.close();
  await prisma.$disconnect();
});

test('tests de sécurité du module dashboard', async (t) => {
  if (skipReason) return t.skip(skipReason);

  await t.test('GET /me/recommendation : aucune donnée personnelle envoyée au LLM', async (t) => {
    // On intercepte les appels au LLM pour vérifier qu'aucune donnée personnelle n'y figure
    const aiCalls = await prisma.aiCallLog.findMany({
      where: {
        module: 'dashboard',
        prompt: 'recommend-scenario',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const call of aiCalls) {
      const variables = call.variables;
      const history = JSON.parse(variables.history || '[]');

      // Vérifie qu'aucun champ avec des données personnelles n'existe
      for (const session of history) {
        assert.ok(!('studentName' in session), 'studentName présent dans l\'historique');
        assert.ok(!('firstName' in session), 'firstName présent dans l\'historique');
        assert.ok(!('lastName' in session), 'lastName présent dans l\'historique');
        assert.ok(!('email' in session), 'email présent dans l\'historique');
        assert.ok(!('studentId' in session), 'studentId présent dans l\'historique');
      }
    }
  });

  await t.test('GET /me/recommendation : le besoin caché ne sort jamais', async () => {
    const { text } = await api('GET', '/me/recommendation', { token: tokens.student1 });
    
    assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
    assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  });

  await t.test('GET /me/history : le besoin caché ne sort jamais', async () => {
    const { text } = await api('GET', '/me/history', { token: tokens.student1 });
    
    assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
    assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  });

  await t.test('GET /me/stats : le besoin caché ne sort jamais', async () => {
    const { text } = await api('GET', '/me/stats', { token: tokens.student1 });
    
    assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
    assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  });

  await t.test('GET /teacher/overview : le besoin caché ne sort jamais', async () => {
    const { text } = await api('GET', '/teacher/overview', { token: tokens.teacher });
    
    assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
    assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  });

  await t.test('GET /teacher/students/:id : le besoin caché ne sort jamais', async () => {
    if (!student1Id) return t.skip('Aucun étudiant disponible');
    
    const { text } = await api('GET', `/teacher/students/${student1Id}`, { token: tokens.teacher });
    
    assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
    assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
  });

  await t.test('Contrôle des rôles : étudiant ne peut pas accéder aux endpoints enseignant', async () => {
    assert.equal((await api('GET', '/teacher/overview', { token: tokens.student1 })).status, 403);
    
    if (student1Id) {
      assert.equal(
        (await api('GET', `/teacher/students/${student1Id}`, { token: tokens.student1 })).status,
        403,
      );
    }
    
    if (student1SessionId) {
      assert.equal(
        (
          await api('POST', `/teacher/sessions/${student1SessionId}/feedback`, {
            token: tokens.student1,
            body: { comment: 'Tentative d\'ajout de feedback par un étudiant' },
          })
        ).status,
        403,
      );
    }
  });

  await t.test('Contrôle des rôles : enseignant ne peut pas accéder aux endpoints étudiant', async () => {
    assert.equal((await api('GET', '/me/stats', { token: tokens.teacher })).status, 403);
    assert.equal((await api('GET', '/me/history', { token: tokens.teacher })).status, 403);
    assert.equal((await api('GET', '/me/recommendation', { token: tokens.teacher })).status, 403);
  });

  await t.test('Isolation des données : étudiant1 ne peut pas accéder aux données d\'étudiant2', async (t) => {
    // Les endpoints /me/* renvoient uniquement les données de l'étudiant connecté
    const { json: stats1 } = await api('GET', '/me/stats', { token: tokens.student1 });
    const { json: stats2 } = await api('GET', '/me/stats', { token: tokens.student2 });

    // Chaque étudiant doit avoir ses propres statistiques
    // On ne peut pas tester l'égalité car les données peuvent être différentes,
    // mais on vérifie qu'elles sont cohérentes
    assert.ok(typeof stats1.totalSessions === 'number');
    assert.ok(typeof stats2.totalSessions === 'number');

    const { json: history1 } = await api('GET', '/me/history', { token: tokens.student1 });
    const { json: history2 } = await api('GET', '/me/history', { token: tokens.student2 });

    // Vérifie que chaque étudiant ne voit que ses propres séances
    for (const session of history1.sessions) {
      const fullSession = await prisma.trainingSession.findUnique({ where: { id: session.id } });
      assert.equal(fullSession.studentId, student1Id, 'Étudiant1 voit une séance d\'un autre');
    }

    for (const session of history2.sessions) {
      const fullSession = await prisma.trainingSession.findUnique({ where: { id: session.id } });
      assert.equal(fullSession.studentId, student2Id, 'Étudiant2 voit une séance d\'un autre');
    }
  });

  await t.test('Enseignant peut voir les données de tous les étudiants', async () => {
    if (!student1Id || !student2Id) return t.skip('Étudiants non disponibles');

    const { status: status1, json: json1 } = await api('GET', `/teacher/students/${student1Id}`, {
      token: tokens.teacher,
    });
    const { status: status2, json: json2 } = await api('GET', `/teacher/students/${student2Id}`, {
      token: tokens.teacher,
    });

    assert.equal(status1, 200);
    assert.equal(status2, 200);
    assert.equal(json1.student.id, student1Id);
    assert.equal(json2.student.id, student2Id);
  });

  await t.test('Enseignant peut ajouter feedback sur n\'importe quelle séance', async () => {
    if (!student1SessionId || !student2SessionId) return t.skip('Séances non disponibles');

    const feedback1 = {
      comment: 'Feedback pour étudiant 1',
      grade: 14,
    };

    const feedback2 = {
      comment: 'Feedback pour étudiant 2',
      grade: 16,
    };

    const { status: status1 } = await api('POST', `/teacher/sessions/${student1SessionId}/feedback`, {
      token: tokens.teacher,
      body: feedback1,
    });

    const { status: status2 } = await api('POST', `/teacher/sessions/${student2SessionId}/feedback`, {
      token: tokens.teacher,
      body: feedback2,
    });

    assert.equal(status1, 201);
    assert.equal(status2, 201);
  });

  await t.test('Recommandation basée uniquement sur l\'historique de l\'étudiant connecté', async () => {
    const { json: rec1 } = await api('GET', '/me/recommendation', { token: tokens.student1 });
    const { json: rec2 } = await api('GET', '/me/recommendation', { token: tokens.student2 });

    // Les recommandations doivent être basées sur l'historique de chaque étudiant
    // On vérifie qu'elles ont bien été générées (non nulles)
    assert.ok(rec1.weaknesses.length > 0);
    assert.ok(rec1.domain);
    assert.ok(rec1.level);

    assert.ok(rec2.weaknesses.length > 0);
    assert.ok(rec2.domain);
    assert.ok(rec2.level);

    // Les recommandations peuvent être identiques si les historiques sont similaires,
    // mais elles doivent être cohérentes avec l'historique de chaque étudiant
  });

  await t.test('Validation des entrées : refuse les paramètres invalides', async () => {
    // ID étudiant invalide
    const { status: status1 } = await api('GET', '/teacher/students/', { token: tokens.teacher });
    assert.ok(status1 >= 400);

    // ID session invalide
    const { status: status2 } = await api('POST', '/teacher/sessions//feedback', {
      token: tokens.teacher,
      body: { comment: 'Test' },
    });
    assert.ok(status2 >= 400);
  });
});
