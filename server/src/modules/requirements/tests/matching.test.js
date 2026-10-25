// Tests unitaires du matching besoin caché ↔ exigences (sans base de données).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitSentences,
  buildReferencePoints,
  createMatchingSchema,
  summarizeMatching,
  scoreFromMatching,
  matchingToText,
  applyMatching,
} from '../requirements.matching.js';
import { buildEvaluation } from '../mocks/evaluate-document.mock.js';
import matchRequirementsMock from '../mocks/match-requirements.mock.js';
import { loadPrompt } from '../../../shared/ai/promptLoader.js';

const SECRETS = {
  hiddenNeed:
    'Réduire les rendez-vous non honorés qui font perdre du temps et de l\'argent au cabinet. Les patients oublient leurs rendez-vous. Ok.',
  implicitConstraints: ['La secrétaire utilise un vieil ordinateur sous Windows 7', 'Les patients âgés n\'ont pas de smartphone', ' '],
};

const REQUIREMENTS = [
  {
    type: 'FUNCTIONAL',
    code: 'EF-01',
    title: 'Rappel des rendez-vous',
    description: 'Le système doit envoyer un rappel aux patients pour réduire les rendez-vous non honorés.',
    priority: 'MUST',
  },
  {
    type: 'NON_FUNCTIONAL',
    code: 'ENF-01',
    title: 'Compatibilité',
    description: 'Le logiciel doit fonctionner sur un ordinateur ancien sous Windows 7.',
    priority: 'MUST',
  },
  { type: 'FUNCTIONAL', code: 'EF-02', title: 'Facturation', description: 'Le système doit éditer une facture mensuelle.', priority: 'COULD' },
];
const CODES = REQUIREMENTS.map((requirement) => requirement.code);
const POINTS = buildReferencePoints(SECRETS);

const match = (pointId, status, requirementCodes = [], confidence = 0.8) => ({ pointId, status, requirementCodes, confidence });
const VALID = {
  matches: [match('N1', 'COVERED', ['EF-01']), match('N2', 'PARTIAL', ['EF-01']), match('C1', 'COVERED', ['ENF-01']), match('C2', 'MISSING')],
};

test('le besoin caché est découpé par phrase, les fragments courts sont rattachés', () => {
  assert.deepEqual(splitSentences('Première phrase assez longue. Deuxième phrase assez longue ; Ok.'), [
    'Première phrase assez longue.',
    'Deuxième phrase assez longue ; Ok.',
  ]);
  assert.deepEqual(splitSentences(''), []);
});

test('les points de référence ont des identifiants N… et C…, sans contrainte vide', () => {
  assert.deepEqual(POINTS.map((point) => point.id), ['N1', 'N2', 'C1', 'C2']);
  assert.deepEqual(POINTS.map((point) => point.kind), ['NEED', 'NEED', 'CONSTRAINT', 'CONSTRAINT']);
});

test('le schéma accepte un matching complet et cohérent', () => {
  const result = createMatchingSchema(POINTS, CODES).safeParse(VALID);
  assert.equal(result.success, true, result.error?.issues[0]?.message);
});

test('le schéma refuse un matching incohérent', () => {
  const schema = createMatchingSchema(POINTS, CODES);
  const variants = {
    'point manquant': VALID.matches.slice(0, 3),
    'point inconnu': [...VALID.matches, match('N9', 'MISSING')],
    'point en double': [...VALID.matches, match('N1', 'MISSING')],
    'code inventé': [match('N1', 'COVERED', ['EF-99']), ...VALID.matches.slice(1)],
    'MISSING avec un code': [match('N1', 'MISSING', ['EF-01']), ...VALID.matches.slice(1)],
    'COVERED sans code': [match('N1', 'COVERED'), ...VALID.matches.slice(1)],
    'statut inconnu': [match('N1', 'MAYBE', ['EF-01']), ...VALID.matches.slice(1)],
    'confiance > 1': [match('N1', 'COVERED', ['EF-01'], 1.5), ...VALID.matches.slice(1)],
  };
  for (const [name, matches] of Object.entries(variants)) {
    assert.equal(schema.safeParse({ matches }).success, false, name);
  }
});

test('la version publique du matching ne contient aucun texte secret', () => {
  const summary = summarizeMatching(POINTS, VALID, CODES);
  const json = JSON.stringify(summary);
  for (const point of POINTS) assert.ok(!json.includes(point.text), point.id);
  assert.deepEqual(summary.NEED.map((point) => point.status), ['COVERED', 'PARTIAL']);
  assert.deepEqual(summary.unmatchedCodes, ['EF-02']);
});

test('la note se calcule à partir des statuts (couvert = 1, partiel = 0,5)', () => {
  const summary = summarizeMatching(POINTS, VALID, CODES);
  assert.equal(scoreFromMatching(summary.NEED, 30), 23); // 30 × 1,5 / 2 = 22,5
  assert.equal(scoreFromMatching(summary.CONSTRAINT, 15), 8); // 15 × 1 / 2 = 7,5
  assert.equal(scoreFromMatching([], 15), null);
});

test('applyMatching remplace les deux notes, joint le matching et recalcule la note globale', () => {
  const summary = summarizeMatching(POINTS, VALID, CODES);
  const evaluation = applyMatching(buildEvaluation(REQUIREMENTS), summary);
  const [coverage, constraints, ...others] = evaluation.criteria;
  assert.equal(coverage.score, 23);
  assert.equal(constraints.score, 8);
  assert.deepEqual(coverage.matching.unmatchedCodes, ['EF-02']);
  assert.equal(constraints.matching.points.length, 2);
  assert.ok(others.every((criterion) => !('matching' in criterion)));
  assert.equal(evaluation.globalScore, evaluation.criteria.reduce((total, criterion) => total + criterion.score, 0));
});

test('sans contrainte implicite, la note du LLM est conservée pour ce critère', () => {
  const points = buildReferencePoints({ hiddenNeed: SECRETS.hiddenNeed });
  const summary = summarizeMatching(points, { matches: [match('N1', 'MISSING'), match('N2', 'MISSING')] }, CODES);
  const base = buildEvaluation(REQUIREMENTS);
  const evaluation = applyMatching(base, summary);
  assert.equal(evaluation.criteria[0].score, 0);
  assert.equal(evaluation.criteria[1].score, base.criteria[1].score);
});

test('le mock est conforme au schéma et dépend du contenu des exigences', () => {
  const schema = createMatchingSchema(POINTS, CODES);
  for (const variables of [
    { referencePoints: POINTS, requirements: REQUIREMENTS },
    { referencePoints: JSON.stringify(POINTS), requirements: JSON.stringify(REQUIREMENTS) },
  ]) {
    const matching = matchRequirementsMock({ variables });
    const result = schema.safeParse(matching);
    assert.equal(result.success, true, result.error?.issues[0]?.message);
    const byId = Object.fromEntries(matching.matches.map((item) => [item.pointId, item]));
    assert.equal(byId.N1.status, 'COVERED');
    assert.ok(byId.N1.requirementCodes.includes('EF-01'));
    assert.ok(byId.C1.requirementCodes.includes('ENF-01'));
    assert.notEqual(byId.C2.status, 'COVERED', 'aucune exigence ne parle des patients sans smartphone');
  }

  const empty = matchRequirementsMock({ variables: { referencePoints: POINTS, requirements: [] } });
  assert.ok(empty.matches.every((item) => item.status === 'MISSING'));
  assert.equal(createMatchingSchema(POINTS, []).safeParse(empty).success, true);
});

test('le texte du matching pour evaluate-document indique les statuts et les codes', () => {
  const text = matchingToText(POINTS, summarizeMatching(POINTS, VALID, CODES));
  assert.match(text, /N1 \(besoin\).*couvert par EF-01/);
  assert.match(text, /C2 \(contrainte\).*non couvert$/m);
  assert.match(text, /sans lien avec le besoin réel : EF-02/);
});

test('le prompt match-requirements v0.1 se charge avec toutes ses variables', async () => {
  const prompt = await loadPrompt('requirements', 'match-requirements', {
    context: 'Cabinet médical',
    expressedNeed: 'Une application de rendez-vous',
    level: 'débutant',
    referencePoints: POINTS,
    acceptedChanges: 'Aucune.',
    requirements: REQUIREMENTS,
  });
  assert.ok(!prompt.includes('<!--'), 'les commentaires de documentation ne partent pas au LLM');
  assert.ok(!/\{\{\w+\}\}/.test(prompt), 'toutes les variables sont remplacées');
  assert.ok(prompt.includes('"N1"') && prompt.includes('"C2"'));
});
