// Tests de la Self-consistency (partie IA du module 3), sans base de données ni clé API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AiError } from '../../../shared/ai/index.js';
import { aggregateEvaluations, evaluateWithSelfConsistency, EVALUATION_SAMPLES, SAMPLING_TEMPERATURE } from '../change-requests.consistency.js';
import { responseEvaluationSchema } from '../change-requests.schemas.js';
import evaluateResponseMock from '../mocks/evaluate-response.mock.js';

const evaluation = (expectedDecision, score, label = expectedDecision) => ({
  reasoning: `Raisonnement de test menant à ${expectedDecision}.`,
  score,
  expectedDecision,
  feedback: `Retour ${label}`,
  clientReaction: `Réaction ${label}`,
});

test('3 évaluations unanimes : décision unanime et note médiane', () => {
  const result = aggregateEvaluations([evaluation('NEGOTIATE', 70), evaluation('NEGOTIATE', 80, 'b'), evaluation('NEGOTIATE', 75, 'c')]);
  assert.equal(result.expectedDecision, 'NEGOTIATE');
  assert.equal(result.score, 75);
  assert.equal(result.feedback, 'Retour c', 'le retour vient de l\'évaluation la plus proche de la médiane');
  assert.deepEqual(result.votes, { ACCEPT: 0, NEGOTIATE: 3, REFUSE: 0 });
  assert.equal(result.agreement, 3);
  assert.equal(result.uncertain, false);
});

test('2 NEGOTIATE contre 1 ACCEPT : la majorité l\'emporte, l\'évaluation divergente est écartée', () => {
  const result = aggregateEvaluations([evaluation('ACCEPT', 95, 'divergente'), evaluation('NEGOTIATE', 60, 'a'), evaluation('NEGOTIATE', 70, 'b')]);
  assert.equal(result.expectedDecision, 'NEGOTIATE');
  assert.equal(result.score, 65, 'médiane des 2 évaluations majoritaires, sans la note de 95');
  assert.notEqual(result.feedback, 'Retour divergente');
  assert.deepEqual(result.votes, { ACCEPT: 1, NEGOTIATE: 2, REFUSE: 0 });
  assert.equal(result.agreement, 2);
  assert.equal(result.uncertain, false);
});

test('3 décisions différentes : évaluation signalée comme incertaine', () => {
  const result = aggregateEvaluations([evaluation('ACCEPT', 40), evaluation('NEGOTIATE', 60), evaluation('REFUSE', 90)]);
  assert.equal(result.uncertain, true);
  assert.equal(result.agreement, 1);
  assert.equal(result.score, 60);
  assert.equal(result.expectedDecision, 'NEGOTIATE', 'décision de l\'évaluation médiane');
});

test('les évaluations sont lancées en parallèle avec une température non nulle', async () => {
  const requests = [];
  const call = async (request) => {
    requests.push(request);
    return evaluation('REFUSE', 50 + requests.length);
  };
  const result = await evaluateWithSelfConsistency({ prompt: 'evaluate-response', temperature: SAMPLING_TEMPERATURE }, { call });
  assert.equal(requests.length, EVALUATION_SAMPLES);
  assert.ok(requests.every((request) => request.temperature > 0));
  assert.equal(result.samples, 3);
  assert.equal(result.score, 52);
});

test('une évaluation en échec n\'empêche pas d\'agréger les autres', async () => {
  let index = 0;
  const call = async () => {
    index += 1;
    if (index === 2) throw new AiError('AI_RATE_LIMIT');
    return evaluation('NEGOTIATE', 70);
  };
  const result = await evaluateWithSelfConsistency({}, { call });
  assert.equal(result.samples, 2);
  assert.equal(result.expectedDecision, 'NEGOTIATE');
});

test('si toutes les évaluations échouent, l\'erreur du service IA est renvoyée', async () => {
  const call = async () => {
    throw new AiError('AI_TIMEOUT');
  };
  await assert.rejects(evaluateWithSelfConsistency({}, { call }), { code: 'AI_TIMEOUT' });
});

test('le raisonnement est obligatoire et le mock le fournit pour chaque décision', () => {
  const { reasoning, ...withoutReasoning } = evaluation('ACCEPT', 50);
  assert.ok(reasoning);
  assert.equal(responseEvaluationSchema.safeParse(withoutReasoning).success, false);
  for (const decision of ['ACCEPT', 'NEGOTIATE', 'REFUSE']) {
    assert.ok(responseEvaluationSchema.safeParse(evaluateResponseMock({ variables: { decision } })).success, decision);
  }
});
