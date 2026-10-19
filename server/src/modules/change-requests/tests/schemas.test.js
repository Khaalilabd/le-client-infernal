// Tests unitaires du module change-requests (sans base de données ni réseau).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    sessionParamsSchema,
    changeRequestParamsSchema,
    respondBodySchema,
    generatedChangeRequestSchema,
    responseEvaluationSchema,
} from '../change-requests.schemas.js';
import generateChangeMock from '../mocks/generate-change.mock.js';
import evaluateResponseMock from '../mocks/evaluate-response.mock.js';
import { loadPrompt } from '../../../shared/ai/promptLoader.js';

// ---------- Schémas Zod ----------

test('respondBodySchema accepte ACCEPT', () => {
    const parsed = respondBodySchema.parse({ decision: 'ACCEPT', justification: 'Je l\'accepte car l\'impact est faible et les délais sont tenus.' });
    assert.equal(parsed.decision, 'ACCEPT');
});

test('respondBodySchema accepte NEGOTIATE', () => {
    const parsed = respondBodySchema.parse({ decision: 'NEGOTIATE', justification: 'Je négocie pour reporter la livraison au prochain lot.' });
    assert.equal(parsed.decision, 'NEGOTIATE');
});

test('respondBodySchema accepte REFUSE', () => {
    const parsed = respondBodySchema.parse({ decision: 'REFUSE', justification: 'Je refuse car cela dépasse le périmètre initial et compromet les délais.' });
    assert.equal(parsed.decision, 'REFUSE');
});

test('respondBodySchema refuse une décision invalide', () => {
    assert.equal(respondBodySchema.safeParse({ decision: 'IGNORE', justification: 'x'.repeat(20) }).success, false);
});

test('respondBodySchema refuse une justification trop courte', () => {
    const result = respondBodySchema.safeParse({ decision: 'ACCEPT', justification: 'Court' });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((i) => i.path[0] === 'justification'));
});

test('sessionParamsSchema accepte un sessionId non vide', () => {
    assert.ok(sessionParamsSchema.safeParse({ sessionId: 'abc123' }).success);
});

test('changeRequestParamsSchema accepte un changeRequestId non vide', () => {
    assert.ok(changeRequestParamsSchema.safeParse({ changeRequestId: 'xyz456' }).success);
});

// ---------- generatedChangeRequestSchema ----------

const validGenerated = {
    title: 'Ajouter un export PDF',
    description: 'Le client veut exporter les rapports en PDF pour les partenaires.',
    reason: 'Nos partenaires n\'ont pas accès à l\'application.',
    impact: { scope: 'Module rapports', effort: 'MEDIUM', risk: 'Retard lot 1' },
};

test('generatedChangeRequestSchema accepte une demande valide', () => {
    assert.ok(generatedChangeRequestSchema.safeParse(validGenerated).success);
});

test('generatedChangeRequestSchema refuse un effort invalide', () => {
    const bad = { ...validGenerated, impact: { ...validGenerated.impact, effort: 'EXTREME' } };
    assert.equal(generatedChangeRequestSchema.safeParse(bad).success, false);
});

test('generatedChangeRequestSchema refuse un titre trop court', () => {
    const bad = { ...validGenerated, title: 'AB' };
    assert.equal(generatedChangeRequestSchema.safeParse(bad).success, false);
});

// ---------- responseEvaluationSchema ----------

const validEvaluation = {
    score: 75,
    expectedDecision: 'NEGOTIATE',
    feedback: 'Bonne analyse de l\'impact, proposez une alternative concrète.',
    clientReaction: 'D\'accord si c\'est livré dans les six semaines.',
};

test('responseEvaluationSchema accepte une évaluation valide', () => {
    assert.ok(responseEvaluationSchema.safeParse(validEvaluation).success);
});

test('responseEvaluationSchema refuse un score hors [0, 100]', () => {
    assert.equal(responseEvaluationSchema.safeParse({ ...validEvaluation, score: 101 }).success, false);
    assert.equal(responseEvaluationSchema.safeParse({ ...validEvaluation, score: -1 }).success, false);
});

test('responseEvaluationSchema refuse si feedback mentionne le besoin caché', () => {
    const bad = { ...validEvaluation, feedback: 'Le besoin caché est de réduire les rendez-vous non honorés.' };
    assert.equal(responseEvaluationSchema.safeParse(bad).success, false);
});

// ---------- Mocks ----------

test('le mock generate-change est conforme au schéma pour chaque index', () => {
    for (let i = 0; i < 3; i++) {
        const result = generateChangeMock({ variables: { previousRequests: Array(i).fill('- Demande').join('\n') } });
        const parsed = generatedChangeRequestSchema.safeParse(result);
        assert.ok(parsed.success, `Sample ${i} : ${parsed.error?.issues[0]?.message}`);
    }
});

test('le mock evaluate-response est conforme selon la décision ACCEPT', () => {
    const result = evaluateResponseMock({ variables: { decision: 'ACCEPT' } });
    assert.ok(responseEvaluationSchema.safeParse(result).success);
});

test('le mock evaluate-response est conforme selon la décision NEGOTIATE', () => {
    const result = evaluateResponseMock({ variables: { decision: 'NEGOTIATE' } });
    assert.ok(responseEvaluationSchema.safeParse(result).success);
});

test('le mock evaluate-response est conforme selon la décision REFUSE', () => {
    const result = evaluateResponseMock({ variables: { decision: 'REFUSE' } });
    assert.ok(responseEvaluationSchema.safeParse(result).success);
});

test('le mock evaluate-response ne révèle pas le besoin caché', () => {
    for (const decision of ['ACCEPT', 'NEGOTIATE', 'REFUSE']) {
        const result = evaluateResponseMock({ variables: { decision } });
        assert.ok(!result.feedback.toLowerCase().includes('besoin caché'), `feedback REFUSE contient "besoin caché"`);
        assert.ok(!result.clientReaction.toLowerCase().includes('besoin caché'), `clientReaction contient "besoin caché"`);
    }
});

// ---------- Prompts ----------

test('le prompt generate-change v0.2 se construit avec toutes ses variables', async () => {
    const prompt = await loadPrompt('change-requests', 'generate-change', {
        clientName: 'M. Test',
        personality: '{"traits":["pressé"]}',
        context: 'Une boulangerie artisanale.',
        expressedNeed: 'Un système de commandes en ligne.',
        hiddenNeed: 'Réduire les pertes de gâteaux invendus.',
        level: 'INTERMEDIATE',
        previousRequests: 'Aucune demande précédente.',
        currentRequirements: '- [fonctionnelle] EF-01 : Commande en ligne',
        requestNumber: 1,
        maxRequests: 3,
    });
    assert.ok(!prompt.includes('{{'), 'variable non remplacée');
    assert.ok(!prompt.includes('<!--'), 'commentaire non retiré');
    assert.ok(prompt.includes('EF-01'), 'exigences incluses');
});

test('le prompt evaluate-response v0.2 se construit avec toutes ses variables', async () => {
    const prompt = await loadPrompt('change-requests', 'evaluate-response', {
        context: 'Une boulangerie.',
        expressedNeed: 'Commandes en ligne.',
        hiddenNeed: 'Réduire les pertes.',
        personality: '{"traits":["pressé"]}',
        clientName: 'M. Test',
        level: 'INTERMEDIATE',
        changeRequestTitle: 'Export PDF',
        changeRequestDescription: 'Exporter les rapports en PDF.',
        changeRequestReason: 'Partenaires sans accès.',
        changeRequestImpact: '{"scope":"rapports","effort":"MEDIUM","risk":"retard"}',
        decision: 'NEGOTIATE',
        justification: 'Je propose de livrer ça dans le lot 2.',
    });
    assert.ok(!prompt.includes('{{'), 'variable non remplacée');
    assert.ok(!prompt.includes('<!--'), 'commentaire non retiré');
});
