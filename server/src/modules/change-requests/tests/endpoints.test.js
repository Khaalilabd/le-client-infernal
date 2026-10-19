// Tests d'intégration des endpoints du module change-requests.
// Nécessitent la base de démonstration (npm run db:up && npm run db:seed) ;
// ils sont ignorés automatiquement si la base est inaccessible.
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

async function api(method, path, { token, body } = {}) {
    const response = await fetch(`${baseUrl}/api/change-requests${path}`, {
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

/** Vérifie qu'aucun secret ne sort de l'API */
function assertNoSecret(text) {
    assert.ok(!text.includes('hiddenNeed'), 'hiddenNeed présent dans la réponse');
    assert.ok(!text.includes('implicitConstraints'), 'implicitConstraints présent dans la réponse');
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
    } catch {
        skipReason = 'comptes de démonstration absents (npm run db:seed)';
    }
});

after(async () => {
    server?.close();
    await prisma.$disconnect();
});

test('endpoints du module change-requests', async (t) => {
    if (skipReason) return t.skip(skipReason);

    // Intercepte les alertes responseGuard
    const guardAlerts = [];
    const originalError = console.error;
    console.error = (...args) => {
        if (String(args[0]).includes('responseGuard')) guardAlerts.push(args[0]);
        else originalError(...args);
    };
    t.after(() => { console.error = originalError; });

    // Séances dédiées au test (supprimées à la fin) : etudiant1 travaille, etudiant2 sert au contrôle d'accès.
    // Le test ne dépend ainsi ni des séances de démonstration ni des tests des autres modules lancés en parallèle.
    const [student1, student2, scenario] = await Promise.all([
        prisma.user.findUnique({ where: { email: 'etudiant1@demo.tn' } }),
        prisma.user.findUnique({ where: { email: 'etudiant2@demo.tn' } }),
        prisma.scenario.findFirst({ orderBy: { createdAt: 'asc' } }),
    ]);
    if (!student1 || !student2 || !scenario) return t.skip('Données de démonstration absentes (npm run db:seed)');
    const sessionInProgress = await prisma.trainingSession.create({ data: { studentId: student1.id, scenarioId: scenario.id } });
    const otherSession = await prisma.trainingSession.create({ data: { studentId: student2.id, scenarioId: scenario.id } });
    t.after(() => prisma.trainingSession.deleteMany({ where: { id: { in: [sessionInProgress.id, otherSession.id] } } }));
    const sessionId = sessionInProgress.id;

    // ── Authentification ──────────────────────────────────────────────────────

    await t.test('authentification obligatoire', async () => {
        assert.equal((await api('GET', `/sessions/${sessionId}`)).status, 401);
        assert.equal((await api('POST', `/sessions/${sessionId}/generate`)).status, 401);
        assert.equal((await api('POST', '/some-id/respond', { body: {} })).status, 401);
    });

    // ── GET /sessions/:sessionId ──────────────────────────────────────────────

    await t.test('GET /sessions/:sessionId renvoie la liste des demandes', async () => {
        const { status, json, text } = await api('GET', `/sessions/${sessionId}`, { token: tokens.student1 });
        assert.equal(status, 200);
        assert.ok(Array.isArray(json.changeRequests), 'changeRequests doit être un tableau');
        assertNoSecret(text);
    });

    await t.test('GET /sessions/:sessionId est accessible à l\'enseignant', async () => {
        const { status } = await api('GET', `/sessions/${sessionId}`, { token: tokens.teacher });
        assert.equal(status, 200);
    });

    // ── POST /sessions/:sessionId/generate ───────────────────────────────────

    let generatedId;
    await t.test('POST generate crée une demande de changement', async () => {
        // S'assurer que la séance n'a pas déjà 3 demandes
        await prisma.changeRequest.deleteMany({ where: { sessionId } });

        const { status, json, text } = await api('POST', `/sessions/${sessionId}/generate`, { token: tokens.student1 });
        assert.equal(status, 201);
        assert.ok(json.changeRequest.id, 'id présent');
        assert.ok(json.changeRequest.title, 'title présent');
        assert.equal(json.changeRequest.status, 'PENDING');
        assertNoSecret(text);
        generatedId = json.changeRequest.id;
    });

    await t.test('POST generate est réservé à l\'étudiant propriétaire', async () => {
        if (!otherSession) return;
        // Étudiant 2 ne peut pas générer sur la séance de étudiant 1
        const { status } = await api('POST', `/sessions/${sessionId}/generate`, { token: tokens.student2 });
        assert.equal(status, 403);
    });

    await t.test('POST generate refuse si la limite est atteinte', async () => {
        // Remplir jusqu'à la limite (3)
        await api('POST', `/sessions/${sessionId}/generate`, { token: tokens.student1 });
        await api('POST', `/sessions/${sessionId}/generate`, { token: tokens.student1 });
        // La 4e doit être refusée
        const { status } = await api('POST', `/sessions/${sessionId}/generate`, { token: tokens.student1 });
        assert.equal(status, 409, 'doit retourner 409 à la limite');
    });

    await t.test('POST generate est réservé aux étudiants (enseignant refusé)', async () => {
        const { status } = await api('POST', `/sessions/${sessionId}/generate`, { token: tokens.teacher });
        assert.equal(status, 403);
    });

    // ── POST /:changeRequestId/respond ───────────────────────────────────────

    await t.test('POST respond enregistre la décision et renvoie clientReaction', async () => {
        assert.ok(generatedId, 'un changeRequestId doit exister');
        const { status, json, text } = await api('POST', `/${generatedId}/respond`, {
            token: tokens.student1,
            body: { decision: 'NEGOTIATE', justification: 'Je propose de reporter la livraison au lot 2 dans six semaines.' },
        });
        assert.equal(status, 200);
        assert.equal(json.changeRequest.status, 'ANSWERED');
        assert.equal(json.changeRequest.decision, 'NEGOTIATE');
        assert.ok(typeof json.changeRequest.score === 'number', 'score présent');
        assert.ok(json.changeRequest.feedback, 'feedback présent');
        assert.ok(json.clientReaction, 'clientReaction présente');
        assertNoSecret(text);

        // La réaction du client est enregistrée : elle reste visible après un rechargement de la liste
        const list = await api('GET', `/sessions/${sessionId}`, { token: tokens.student1 });
        const saved = list.json.changeRequests.find((cr) => cr.id === generatedId);
        assert.equal(saved.clientReaction, json.clientReaction);
    });

    await t.test('POST respond refuse une demande déjà traitée (409)', async () => {
        assert.ok(generatedId, 'un changeRequestId doit exister');
        const { status, json } = await api('POST', `/${generatedId}/respond`, {
            token: tokens.student1,
            body: { decision: 'ACCEPT', justification: 'Je l\'accepte finalement, c\'est une bonne idée pour le projet.' },
        });
        assert.equal(status, 409);
        assert.ok(json.error, 'erreur JSON attendue');
    });

    await t.test('POST respond refuse une justification trop courte', async () => {
        // Créer une nouvelle demande PENDING
        const newReq = await prisma.changeRequest.create({
            data: {
                sessionId,
                title: 'Test validation',
                description: 'Test.',
                reason: 'Test.',
                impact: { scope: 'test', effort: 'LOW', risk: 'aucun' },
            },
        });
        const { status } = await api('POST', `/${newReq.id}/respond`, {
            token: tokens.student1,
            body: { decision: 'ACCEPT', justification: 'Trop court' },
        });
        assert.equal(status, 400);
        await prisma.changeRequest.delete({ where: { id: newReq.id } });
    });

    await t.test('POST respond est réservé à l\'étudiant propriétaire', async () => {
        // Créer une demande sur la séance de étudiant1, essayer de répondre avec étudiant2
        if (!otherSession) return;
        const req2 = await prisma.changeRequest.create({
            data: {
                sessionId,
                title: 'Test propriétaire',
                description: 'Test d\'accès.',
                reason: 'Vérifier que l\'accès est contrôlé.',
                impact: { scope: 'test', effort: 'LOW', risk: 'aucun' },
            },
        });
        const { status } = await api('POST', `/${req2.id}/respond`, {
            token: tokens.student2,
            body: { decision: 'REFUSE', justification: 'Ce n\'est pas ma séance mais j\'essaie quand même de répondre.' },
        });
        assert.equal(status, 403);
        await prisma.changeRequest.delete({ where: { id: req2.id } });
    });

    await t.test('POST respond est réservé aux étudiants (enseignant refusé)', async () => {
        const req3 = await prisma.changeRequest.create({
            data: {
                sessionId,
                title: 'Test enseignant',
                description: 'Un enseignant ne doit pas pouvoir répondre.',
                reason: 'Contrôle des rôles.',
                impact: { scope: 'test', effort: 'LOW', risk: 'aucun' },
            },
        });
        const { status } = await api('POST', `/${req3.id}/respond`, {
            token: tokens.teacher,
            body: { decision: 'ACCEPT', justification: 'Je suis enseignant et j\'essaie de répondre à la place de l\'étudiant.' },
        });
        assert.equal(status, 403);
        await prisma.changeRequest.delete({ where: { id: req3.id } });
    });

    // ── Sécurité : besoin caché ───────────────────────────────────────────────

    await t.test('le filet de sécurité responseGuard n\'a jamais eu à intervenir', () => {
        assert.deepEqual(guardAlerts, []);
    });
});
