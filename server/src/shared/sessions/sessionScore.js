// Note finale d'une séance (base commune) : moyenne pondérée des notes des modules 2, 3 et 4.
//   entretien (M2)          30 % : moyenne des 3 meilleures proximités des questions, × 100
//   cahier des charges (M4) 50 % : note globale de la dernière évaluation
//   changements (M3)        20 % : moyenne des notes des demandes traitées
// Les poids sont répartis sur les notes disponibles (une séance sans demande de changement
// est notée sur l'entretien et le cahier des charges). Le cahier des charges évalué est obligatoire.
import { prisma } from '../db/prisma.js';

export const SCORE_WEIGHTS = { interview: 0.3, requirements: 0.5, changeRequests: 0.2 };
const BEST_QUESTIONS = 3;

const round1 = (value) => Math.round(value * 10) / 10;

function averageOf(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Note d'entretien : les meilleures questions comptent, l'exploration du contexte n'est pas pénalisée. */
export function interviewScore(proximities) {
  const best = [...proximities].sort((a, b) => b - a).slice(0, BEST_QUESTIONS);
  const value = averageOf(best);
  return value === null ? null : round1(value * 100);
}

/** Moyenne pondérée des composantes disponibles (null si aucune). */
export function weightedFinalScore(components) {
  const available = Object.entries(SCORE_WEIGHTS).filter(([name]) => typeof components[name] === 'number');
  const totalWeight = available.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight === 0) return null;
  return round1(available.reduce((sum, [name, weight]) => sum + components[name] * weight, 0) / totalWeight);
}

/**
 * Notes de chaque étape d'une séance et note finale (provisoire tant que la séance est en cours).
 * Ne renvoie que des notes agrégées : aucune proximité individuelle, aucun secret du scénario.
 */
export async function computeScoreBreakdown(sessionId) {
  const [messages, changeRequests, document] = await Promise.all([
    prisma.interviewMessage.findMany({
      where: { sessionId, sender: 'STUDENT', proximity: { not: null } },
      select: { proximity: true },
    }),
    prisma.changeRequest.findMany({ where: { sessionId, status: 'ANSWERED' }, select: { score: true } }),
    prisma.requirementsDocument.findUnique({
      where: { sessionId },
      select: { evaluations: { orderBy: { createdAt: 'desc' }, take: 1, select: { globalScore: true, version: true } } },
    }),
  ]);

  const requestScores = changeRequests.map((request) => request.score).filter((score) => typeof score === 'number');
  const lastEvaluation = document?.evaluations[0] ?? null;
  const components = {
    interview: interviewScore(messages.map((message) => message.proximity)),
    requirements: lastEvaluation ? lastEvaluation.globalScore : null,
    changeRequests: requestScores.length ? round1(averageOf(requestScores)) : null,
  };

  return {
    components,
    details: {
      questionsCount: messages.length,
      answeredChangeRequests: requestScores.length,
      evaluatedVersion: lastEvaluation?.version ?? null,
    },
    weights: SCORE_WEIGHTS,
    finalScore: weightedFinalScore(components),
  };
}
