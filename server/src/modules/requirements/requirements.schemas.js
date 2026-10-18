import { z } from 'zod';
import { EVALUATION_GRID } from './requirements.grid.js';

export const REQUIREMENT_TYPES = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'USER_STORY'];
export const PRIORITIES = ['MUST', 'SHOULD', 'COULD', 'WONT'];
export const CODE_PREFIXES = { FUNCTIONAL: 'EF', NON_FUNCTIONAL: 'ENF', USER_STORY: 'US' };

const CODE_PATTERN = /^(EF|ENF|US)-\d{2,3}$/;

// ---------- Entrées HTTP ----------

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const versionParamsSchema = sessionParamsSchema.extend({
  version: z.coerce.number().int().positive(),
});

export const requirementInputSchema = z
  .object({
    type: z.enum(REQUIREMENT_TYPES),
    code: z.string().trim().regex(CODE_PATTERN, 'Code attendu : EF-01, ENF-01 ou US-01'),
    title: z.string().trim().min(3, 'Titre trop court').max(150),
    description: z.string().trim().min(5, 'Description trop courte').max(3000),
    priority: z.enum(PRIORITIES).default('SHOULD'),
    acceptanceCriteria: z.array(z.string().trim().min(1)).max(20).optional(),
  })
  .refine((requirement) => requirement.code.startsWith(`${CODE_PREFIXES[requirement.type]}-`), {
    path: ['code'],
    message: 'Le préfixe du code ne correspond pas au type d\'exigence',
  });

/** Liste d'exigences : codes uniques dans le document. */
export const requirementListSchema = z
  .array(requirementInputSchema)
  .max(200)
  .superRefine((requirements, ctx) => {
    const seen = new Set();
    requirements.forEach((requirement, index) => {
      if (seen.has(requirement.code)) {
        ctx.addIssue({ code: 'custom', path: [index, 'code'], message: `Code en double : ${requirement.code}` });
      }
      seen.add(requirement.code);
    });
  });

export const saveDocumentBodySchema = z.object({
  requirements: requirementListSchema,
});

export const createVersionBodySchema = z.object({
  changeRequestId: z.string().min(1),
  reason: z.string().trim().min(5, 'Expliquez en quelques mots ce qui change').max(500),
  requirements: requirementListSchema.min(1, 'Le cahier des charges est vide'),
});

export const listVersionsQuerySchema = z.object({
  changeRequestId: z.string().min(1).optional(),
});

/** Contenu figé d'une version (colonne snapshot) : relu et validé avant affichage. */
export const snapshotSchema = requirementListSchema;

// ---------- Sortie du LLM (prompt evaluate-document) ----------

export const documentEvaluationSchema = z.object({
  globalScore: z.number().int().min(0).max(100),
  criteria: z
    .array(
      z.object({
        name: z.string().min(2),
        score: z.number().min(0),
        maxScore: z.number().positive(),
        comment: z.string().min(3).max(400),
      }),
    )
    .length(EVALUATION_GRID.length),
  feedback: z.string().min(10).max(1000),
  missingPoints: z.array(z.string().min(3).max(300)).min(1).max(4),
});

const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const LEAK_WINDOW = 6;

/**
 * Indique si `text` recopie un passage d'un secret : le secret entier, ou une suite
 * de 6 mots consécutifs pour les secrets plus longs. Les secrets de moins de 3 mots sont ignorés.
 */
export function revealsSecret(text, secrets) {
  const haystack = ` ${normalize(text)} `;
  return secrets.some((secret) => {
    const words = normalize(secret).split(' ').filter(Boolean);
    if (words.length < 3) return false;
    const size = Math.min(LEAK_WINDOW, words.length);
    for (let start = 0; start + size <= words.length; start += 1) {
      if (haystack.includes(` ${words.slice(start, start + size).join(' ')} `)) return true;
    }
    return false;
  });
}

/**
 * Schéma de l'évaluation pour un scénario donné :
 * - les critères sont exactement ceux de la grille, chaque note ≤ son maximum ;
 * - aucun texte affiché à l'étudiant ne recopie le besoin caché ni une contrainte implicite
 *   (sinon la réponse est refusée et callLLM redemande une évaluation).
 */
export function createDocumentEvaluationSchema({ hiddenNeed = '', implicitConstraints = [] } = {}) {
  const secrets = [hiddenNeed, ...implicitConstraints].filter(Boolean);
  return documentEvaluationSchema.superRefine((evaluation, ctx) => {
    EVALUATION_GRID.forEach((expected) => {
      const criterion = evaluation.criteria.find((item) => normalize(item.name) === normalize(expected.name));
      if (!criterion) {
        ctx.addIssue({ code: 'custom', path: ['criteria'], message: `Critère manquant : ${expected.name}` });
      } else if (criterion.maxScore !== expected.maxScore || criterion.score > expected.maxScore) {
        ctx.addIssue({ code: 'custom', path: ['criteria'], message: `Barème incorrect pour : ${expected.name}` });
      }
    });

    const visibleTexts = [
      ['feedback', evaluation.feedback],
      ...evaluation.missingPoints.map((point, index) => [`missingPoints.${index}`, point]),
      ...evaluation.criteria.map((criterion, index) => [`criteria.${index}.comment`, criterion.comment]),
    ];
    for (const [path, text] of visibleTexts) {
      if (revealsSecret(text, secrets)) {
        ctx.addIssue({ code: 'custom', path: path.split('.'), message: 'Le retour révèle le besoin caché' });
      }
    }
  });
}

/** Remet l'évaluation dans l'ordre de la grille et recalcule la note globale (le LLM se trompe parfois dans l'addition). */
export function normalizeEvaluation(evaluation) {
  const criteria = EVALUATION_GRID.map((expected) => {
    const criterion = evaluation.criteria.find((item) => normalize(item.name) === normalize(expected.name));
    return { ...criterion, name: expected.name, score: Math.round(criterion.score) };
  });
  const globalScore = criteria.reduce((total, criterion) => total + criterion.score, 0);
  return { ...evaluation, criteria, globalScore };
}
