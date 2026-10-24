// Matching par le LLM entre le besoin caché et les exigences de l'étudiant (prompt match-requirements).
// Le besoin caché est découpé en points N1, N2… (une phrase = un point) et chaque contrainte implicite
// devient un point C1, C2… Le LLM ne renvoie que des identifiants, des codes d'exigences, un statut et
// une confiance : aucun texte secret ne peut donc sortir du serveur par ce chemin.
// Les notes « Couverture du besoin réel » et « Contraintes implicites identifiées » sont ensuite
// calculées par le serveur à partir de ce matching (notes expliquées et reproductibles).
import { z } from 'zod';
import { EVALUATION_GRID } from './requirements.grid.js';

export const MATCH_STATUSES = ['COVERED', 'PARTIAL', 'MISSING'];
const STATUS_WEIGHT = { COVERED: 1, PARTIAL: 0.5, MISSING: 0 };
const MIN_SENTENCE_LENGTH = 15;

// Critères de la grille calculés à partir du matching, selon le type de point.
const COVERAGE_CRITERION = EVALUATION_GRID[0].name;
const CONSTRAINTS_CRITERION = EVALUATION_GRID[1].name;

/** Découpe un texte en phrases ; les fragments trop courts sont rattachés à la phrase précédente. */
export function splitSentences(text = '') {
  const sentences = [];
  for (const part of text.split(/(?<=[.!?;])\s+/)) {
    const sentence = part.trim();
    if (!sentence) continue;
    if (sentence.length < MIN_SENTENCE_LENGTH && sentences.length > 0) {
      sentences[sentences.length - 1] += ` ${sentence}`;
    } else {
      sentences.push(sentence);
    }
  }
  return sentences;
}

/** Points de référence du scénario (côté serveur uniquement : ils contiennent le texte secret). */
export function buildReferencePoints({ hiddenNeed = '', implicitConstraints = [] } = {}) {
  const needs = splitSentences(hiddenNeed).map((text, index) => ({ id: `N${index + 1}`, kind: 'NEED', text }));
  const constraints = implicitConstraints
    .map((text) => text?.trim())
    .filter(Boolean)
    .map((text, index) => ({ id: `C${index + 1}`, kind: 'CONSTRAINT', text }));
  return [...needs, ...constraints];
}

export const matchingSchema = z.object({
  matches: z.array(
    z.object({
      pointId: z.string().min(1),
      status: z.enum(MATCH_STATUSES),
      requirementCodes: z.array(z.string()).max(10).default([]),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

/**
 * Schéma de la réponse du LLM pour un scénario et un document donnés :
 * chaque point reçoit exactement un résultat, les codes cités existent dans le document,
 * un point MISSING ne cite aucune exigence et un point COVERED ou PARTIAL en cite au moins une.
 */
export function createMatchingSchema(points, codes) {
  const pointIds = new Set(points.map((point) => point.id));
  const knownCodes = new Set(codes);
  return matchingSchema.superRefine(({ matches }, ctx) => {
    const seen = new Set();
    matches.forEach((match, index) => {
      const path = ['matches', index];
      if (!pointIds.has(match.pointId)) {
        ctx.addIssue({ code: 'custom', path, message: `Point inconnu : ${match.pointId}` });
      } else if (seen.has(match.pointId)) {
        ctx.addIssue({ code: 'custom', path, message: `Point en double : ${match.pointId}` });
      }
      seen.add(match.pointId);

      const unknown = match.requirementCodes.filter((code) => !knownCodes.has(code));
      if (unknown.length > 0) {
        ctx.addIssue({ code: 'custom', path, message: `Exigence inconnue : ${unknown.join(', ')}` });
      }
      if (match.status === 'MISSING' && match.requirementCodes.length > 0) {
        ctx.addIssue({ code: 'custom', path, message: 'Un point manquant ne cite aucune exigence' });
      }
      if (match.status !== 'MISSING' && match.requirementCodes.length === 0) {
        ctx.addIssue({ code: 'custom', path, message: 'Un point couvert ou partiel cite au moins une exigence' });
      }
    });
    for (const id of pointIds) {
      if (!seen.has(id)) ctx.addIssue({ code: 'custom', path: ['matches'], message: `Point sans résultat : ${id}` });
    }
  });
}

/**
 * Version publique du matching (sans aucun texte secret), rangée dans l'ordre des points :
 * { NEED: [...], CONSTRAINT: [...], unmatchedCodes }.
 */
export function summarizeMatching(points, { matches }, codes) {
  const byId = new Map(matches.map((match) => [match.pointId, match]));
  const summary = { NEED: [], CONSTRAINT: [] };
  for (const point of points) {
    const { status, requirementCodes, confidence } = byId.get(point.id);
    summary[point.kind].push({ id: point.id, status, requirementCodes: [...new Set(requirementCodes)], confidence });
  }
  const linked = new Set(matches.flatMap((match) => match.requirementCodes));
  return { ...summary, unmatchedCodes: codes.filter((code) => !linked.has(code)) };
}

/** Note d'un critère à partir de ses points : maxScore × (couverts + ½ partiels) / nombre de points. */
export function scoreFromMatching(pointResults, maxScore) {
  if (pointResults.length === 0) return null;
  const covered = pointResults.reduce((total, point) => total + STATUS_WEIGHT[point.status], 0);
  return Math.round((maxScore * covered) / pointResults.length);
}

/** Texte du matching transmis au prompt evaluate-document (côté serveur uniquement). */
export function matchingToText(points, summary) {
  const results = new Map([...summary.NEED, ...summary.CONSTRAINT].map((result) => [result.id, result]));
  const labels = { COVERED: 'couvert', PARTIAL: 'partiellement couvert', MISSING: 'non couvert' };
  const lines = points.map((point) => {
    const { status, requirementCodes } = results.get(point.id);
    const codes = requirementCodes.length ? ` par ${requirementCodes.join(', ')}` : '';
    return `- ${point.id} (${point.kind === 'NEED' ? 'besoin' : 'contrainte'}) « ${point.text} » : ${labels[status]}${codes}`;
  });
  if (summary.unmatchedCodes.length) lines.push(`- Exigences sans lien avec le besoin réel : ${summary.unmatchedCodes.join(', ')}`);
  return lines.join('\n') || 'Aucun point de référence.';
}

/**
 * Remplace les notes de couverture et de contraintes par celles du matching, joint le matching
 * aux deux critères (le format [{ name, score, maxScore, comment }] reste inchangé) et recalcule la note globale.
 * Si un type de point est absent du scénario (ex. aucune contrainte implicite), la note du LLM est conservée.
 */
export function applyMatching(evaluation, summary) {
  const criteria = evaluation.criteria.map((criterion) => {
    if (criterion.name === COVERAGE_CRITERION) {
      const score = scoreFromMatching(summary.NEED, criterion.maxScore);
      return { ...criterion, score: score ?? criterion.score, matching: { points: summary.NEED, unmatchedCodes: summary.unmatchedCodes } };
    }
    if (criterion.name === CONSTRAINTS_CRITERION) {
      const score = scoreFromMatching(summary.CONSTRAINT, criterion.maxScore);
      return { ...criterion, score: score ?? criterion.score, matching: { points: summary.CONSTRAINT } };
    }
    return criterion;
  });
  const globalScore = criteria.reduce((total, criterion) => total + criterion.score, 0);
  return { ...evaluation, criteria, globalScore };
}
