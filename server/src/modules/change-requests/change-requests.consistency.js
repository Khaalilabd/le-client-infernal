// Self-consistency (cours Prompt Engineering, p. 16) : la réponse de l'étudiant est évaluée
// plusieurs fois par le LLM, avec une température non nulle pour obtenir des raisonnements
// différents, puis les évaluations sont confrontées :
//   - vote majoritaire sur la décision attendue ;
//   - note = médiane des évaluations de la majorité ;
//   - retour et réaction du client repris de l'évaluation la plus proche de cette médiane ;
//   - sans majorité (toutes les décisions diffèrent), l'évaluation est signalée comme incertaine.

import { callLLM } from '../../shared/ai/index.js';

export const EVALUATION_SAMPLES = 3;
export const SAMPLING_TEMPERATURE = 0.7;
export const DECISIONS = ['ACCEPT', 'NEGOTIATE', 'REFUSE'];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/** Évaluation dont la note est la plus proche de la cible (la première en cas d'égalité). */
function closestTo(evaluations, target) {
  return evaluations.reduce((best, evaluation) =>
    Math.abs(evaluation.score - target) < Math.abs(best.score - target) ? evaluation : best,
  );
}

/**
 * @param {Array<{ score: number, expectedDecision: string, feedback: string, clientReaction: string }>} evaluations
 * @returns {{ score, expectedDecision, feedback, clientReaction, votes, agreement, samples, uncertain }}
 */
export function aggregateEvaluations(evaluations) {
  if (evaluations.length === 0) throw new Error('aggregateEvaluations : aucune évaluation');

  const votes = Object.fromEntries(DECISIONS.map((decision) => [decision, 0]));
  for (const evaluation of evaluations) votes[evaluation.expectedDecision] += 1;

  const agreement = Math.max(...Object.values(votes));
  // Majorité : plus de la moitié des évaluations (2 sur 3), ou l'unique évaluation obtenue
  const majority = agreement * 2 > evaluations.length ? DECISIONS.find((decision) => votes[decision] === agreement) : null;

  const pool = majority ? evaluations.filter((evaluation) => evaluation.expectedDecision === majority) : evaluations;
  const score = median(pool.map((evaluation) => evaluation.score));
  const representative = closestTo(pool, score);

  return {
    score,
    expectedDecision: majority ?? representative.expectedDecision,
    feedback: representative.feedback,
    clientReaction: representative.clientReaction,
    votes,
    agreement,
    samples: evaluations.length,
    uncertain: !majority,
  };
}

/**
 * Lance `samples` évaluations indépendantes en parallèle et agrège celles qui réussissent.
 * Si toutes échouent, l'erreur du service IA (quota, délai, réponse invalide…) est renvoyée.
 * @param {object} request options de callLLM (prompt, variables, schéma, temperature…)
 */
export async function evaluateWithSelfConsistency(request, { call = callLLM, samples = EVALUATION_SAMPLES } = {}) {
  const results = await Promise.allSettled(Array.from({ length: samples }, () => call(request)));
  const evaluations = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (evaluations.length === 0) throw results[0].reason;
  return aggregateEvaluations(evaluations);
}
