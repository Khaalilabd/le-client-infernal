// Réponse simulée du prompt match-requirements (mode sans clé API).
// Le vrai matching est fait par le LLM, qui juge le sens. Le mock, lui, compare les mots significatifs
// (sans accents, sans mots vides, racine de 5 lettres) de chaque point et de chaque exigence :
// c'est grossier, mais crédible pour la démo et cela réagit au contenu du cahier des charges.
const STOP_WORDS = new Set([
  'avec', 'dans', 'pour', 'sans', 'sous', 'leur', 'leurs', 'elle', 'elles', 'nous', 'vous', 'sont', 'etre', 'avoir',
  'fait', 'faire', 'plus', 'moins', 'tres', 'tout', 'tous', 'toute', 'toutes', 'cette', 'ces', 'son', 'ses', 'aux',
  'des', 'les', 'une', 'qui', 'que', 'quoi', 'dont', 'mais', 'donc', 'car', 'entre', 'chaque', 'aussi', 'peut',
  'doit', 'doivent', 'systeme', 'application', 'permettre', 'client', 'utilisateur', 'utilisateurs',
]);
const COVERED_THRESHOLD = 0.34;
const PARTIAL_THRESHOLD = 0.17;

function parseList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stems(text = '') {
  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
  return new Set(words.map((word) => word.slice(0, 5)));
}

const requirementText = ({ title, description, acceptanceCriteria = [] }) => [title, description, ...acceptanceCriteria].join(' ');

/** Part des mots du point retrouvés dans l'exigence (0 à 1). */
function overlap(pointStems, requirementStems) {
  if (pointStems.size === 0) return 0;
  let shared = 0;
  for (const stem of pointStems) if (requirementStems.has(stem)) shared += 1;
  return shared / pointStems.size;
}

export function buildMatching(points, requirements) {
  const indexed = requirements.map((requirement) => ({ code: requirement.code, stems: stems(requirementText(requirement)) }));
  const matches = points.map((point) => {
    const pointStems = stems(point.text);
    const ranked = indexed
      .map(({ code, stems: requirementStems }) => ({ code, score: overlap(pointStems, requirementStems) }))
      .filter(({ score }) => score >= PARTIAL_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const best = ranked[0]?.score ?? 0;
    const status = best >= COVERED_THRESHOLD ? 'COVERED' : best >= PARTIAL_THRESHOLD ? 'PARTIAL' : 'MISSING';
    return {
      pointId: point.id,
      status,
      requirementCodes: status === 'MISSING' ? [] : ranked.map(({ code }) => code),
      confidence: Math.round((status === 'MISSING' ? 0.6 : 0.5 + best / 2) * 100) / 100,
    };
  });
  return { matches };
}

export default function matchRequirementsMock({ variables }) {
  return buildMatching(parseList(variables?.referencePoints), parseList(variables?.requirements));
}
