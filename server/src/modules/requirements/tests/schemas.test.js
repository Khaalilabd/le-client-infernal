// Tests unitaires du module requirements (sans base de données).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  requirementInputSchema,
  saveDocumentBodySchema,
  createVersionBodySchema,
  versionParamsSchema,
  snapshotSchema,
  createDocumentEvaluationSchema,
  normalizeEvaluation,
  revealsSecret,
} from '../requirements.schemas.js';
import { EVALUATION_GRID, GRID_TOTAL } from '../requirements.grid.js';
import evaluateDocumentMock, { buildEvaluation } from '../mocks/evaluate-document.mock.js';
import { loadPrompt } from '../../../shared/ai/promptLoader.js';

const SECRETS = {
  hiddenNeed: 'Réduire les rendez-vous non honorés qui font perdre du temps et de l\'argent au cabinet.',
  implicitConstraints: ['La secrétaire utilise un vieil ordinateur sous Windows 7', 'Les patients âgés n\'ont pas de smartphone'],
};

const requirement = (overrides = {}) => ({
  type: 'FUNCTIONAL',
  code: 'EF-01',
  title: 'Prise de rendez-vous',
  description: 'Le système doit permettre de prendre un rendez-vous en moins de 2 minutes.',
  priority: 'MUST',
  ...overrides,
});

const SAMPLE = [
  requirement(),
  requirement({ code: 'EF-02', title: 'Annulation', description: 'Le patient doit pouvoir annuler jusqu\'à 24 h avant.', priority: 'SHOULD' }),
  requirement({ type: 'NON_FUNCTIONAL', code: 'ENF-01', title: 'Disponibilité', description: 'Le service doit être disponible 99 % du temps.', priority: 'SHOULD' }),
  requirement({
    type: 'USER_STORY',
    code: 'US-01',
    title: 'Rappel',
    description: 'En tant que patient, je veux recevoir un rappel la veille afin de ne pas oublier mon rendez-vous.',
    priority: 'COULD',
    acceptanceCriteria: ['Le rappel part à 18 h la veille'],
  }),
];

test('la grille totalise 100 points', () => {
  assert.equal(GRID_TOTAL, 100);
});

test('le préfixe du code doit correspondre au type', () => {
  assert.equal(requirementInputSchema.safeParse(requirement()).success, true);
  assert.equal(requirementInputSchema.safeParse(requirement({ code: 'US-01' })).success, false);
  assert.equal(requirementInputSchema.safeParse(requirement({ code: 'EF-1' })).success, false);
  assert.equal(requirementInputSchema.safeParse(requirement({ type: 'NON_FUNCTIONAL', code: 'ENF-03' })).success, true);
});

test('les codes en double sont refusés', () => {
  const result = saveDocumentBodySchema.safeParse({ requirements: [requirement(), requirement({ title: 'Autre' })] });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /double/);
});

test('une nouvelle version exige une raison et au moins une exigence', () => {
  assert.equal(createVersionBodySchema.safeParse({ changeRequestId: 'cr1', reason: 'Ajout de la livraison', requirements: SAMPLE }).success, true);
  assert.equal(createVersionBodySchema.safeParse({ changeRequestId: 'cr1', reason: 'ok', requirements: SAMPLE }).success, false);
  assert.equal(createVersionBodySchema.safeParse({ changeRequestId: 'cr1', reason: 'Ajout de la livraison', requirements: [] }).success, false);
});

test('le numéro de version de l\'URL est converti en entier positif', () => {
  assert.equal(versionParamsSchema.parse({ sessionId: 's', version: '2' }).version, 2);
  assert.equal(versionParamsSchema.safeParse({ sessionId: 's', version: '0' }).success, false);
  assert.equal(versionParamsSchema.safeParse({ sessionId: 's', version: 'abc' }).success, false);
});

test('un snapshot valide est relu tel quel', () => {
  assert.deepEqual(snapshotSchema.parse(SAMPLE), SAMPLE);
  assert.equal(snapshotSchema.safeParse([{ code: 'EF-01' }]).success, false);
});

test('revealsSecret détecte une recopie, même avec d\'autres accents ou majuscules', () => {
  const secrets = [SECRETS.hiddenNeed, ...SECRETS.implicitConstraints];
  assert.equal(revealsSecret('Le client veut REDUIRE les rendez-vous non honores qui font perdre du temps.', secrets), true);
  assert.equal(revealsSecret('Pensez aux patients âgés n\'ont pas de smartphone.', secrets), true);
  assert.equal(revealsSecret('Interrogez-vous sur ce qui coûte du temps au cabinet.', secrets), false);
});

test('une évaluation qui révèle le besoin caché est refusée', () => {
  const schema = createDocumentEvaluationSchema(SECRETS);
  const evaluation = buildEvaluation(SAMPLE);
  assert.equal(schema.safeParse(evaluation).success, true);

  const leakInFeedback = { ...evaluation, feedback: `Il fallait ${SECRETS.hiddenNeed}` };
  assert.equal(schema.safeParse(leakInFeedback).success, false);

  const leakInPoints = { ...evaluation, missingPoints: [`Ajoutez : ${SECRETS.implicitConstraints[0]}`] };
  assert.equal(schema.safeParse(leakInPoints).success, false);
});

test('une évaluation hors grille est refusée', () => {
  const schema = createDocumentEvaluationSchema(SECRETS);
  const evaluation = buildEvaluation(SAMPLE);

  const overMax = structuredClone(evaluation);
  overMax.criteria[0].score = 35;
  assert.equal(schema.safeParse(overMax).success, false);

  const renamed = structuredClone(evaluation);
  renamed.criteria[1].name = 'Originalité';
  assert.equal(schema.safeParse(renamed).success, false);

  assert.equal(schema.safeParse({ ...evaluation, criteria: evaluation.criteria.slice(0, 5) }).success, false);
  assert.equal(schema.safeParse({ ...evaluation, missingPoints: [] }).success, false);
});

test('la note globale est recalculée et les critères remis dans l\'ordre de la grille', () => {
  const evaluation = buildEvaluation(SAMPLE);
  const shuffled = { ...evaluation, globalScore: 99, criteria: [...evaluation.criteria].reverse() };
  const normalized = normalizeEvaluation(shuffled);
  assert.deepEqual(normalized.criteria.map((criterion) => criterion.name), EVALUATION_GRID.map((criterion) => criterion.name));
  assert.equal(normalized.globalScore, evaluation.criteria.reduce((total, criterion) => total + criterion.score, 0));
});

test('le mock est conforme au schéma et dépend du contenu du cahier des charges', () => {
  const schema = createDocumentEvaluationSchema(SECRETS);
  const documents = {
    vide: [],
    minimal: [requirement({ description: 'Une appli simple et rapide.' })],
    complet: SAMPLE,
  };
  const scores = {};
  for (const [name, requirements] of Object.entries(documents)) {
    // Le mock reçoit les variables du prompt : le tableau ou sa version texte
    for (const variable of [requirements, JSON.stringify(requirements)]) {
      const evaluation = evaluateDocumentMock({ variables: { requirements: variable } });
      const result = schema.safeParse(evaluation);
      assert.equal(result.success, true, `${name} : ${result.error?.issues[0]?.message}`);
      scores[name] = evaluation.globalScore;
    }
  }
  assert.ok(scores.vide < scores.minimal && scores.minimal < scores.complet, JSON.stringify(scores));
});

test('le mock signale les termes vagues', () => {
  const evaluation = buildEvaluation([requirement({ description: 'Une application simple, rapide et intuitive.' })]);
  const ambiguity = evaluation.criteria.find((criterion) => criterion.name === 'Absence d\'ambiguïtés');
  assert.ok(ambiguity.score < ambiguity.maxScore);
  assert.match(ambiguity.comment, /simple/);
});

test('le prompt evaluate-document v0.3 se charge avec toutes ses variables', async () => {
  const prompt = await loadPrompt('requirements', 'evaluate-document', {
    context: 'Cabinet médical',
    expressedNeed: 'Une application de rendez-vous',
    hiddenNeed: SECRETS.hiddenNeed,
    implicitConstraints: SECRETS.implicitConstraints,
    level: 'débutant',
    grid: 'grille',
    version: '2',
    acceptedChanges: 'Aucune.',
    matching: '- N1 (besoin) : couvert par EF-01',
    requirements: SAMPLE,
  });
  assert.ok(!prompt.includes('<!--'), 'les commentaires de documentation ne partent pas au LLM');
  assert.ok(!/\{\{\w+\}\}/.test(prompt), 'toutes les variables sont remplacées');
  for (const criterion of EVALUATION_GRID) assert.ok(prompt.includes(criterion.name), criterion.name);
});
