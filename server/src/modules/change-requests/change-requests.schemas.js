import { z } from 'zod';

// ---------- Entrées HTTP ----------

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const changeRequestParamsSchema = z.object({
  changeRequestId: z.string().min(1),
});

/** Corps de POST /:changeRequestId/respond */
export const respondBodySchema = z.object({
  decision: z.enum(['ACCEPT', 'NEGOTIATE', 'REFUSE']),
  justification: z.string().trim().min(20, 'Justifiez votre décision (20 caractères minimum)').max(3000),
});

// ---------- Sorties du LLM ----------

/** Prompt generate-change v0.2 */
export const generatedChangeRequestSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  reason: z.string().min(10),
  impact: z.object({
    scope: z.string().min(3),
    effort: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    risk: z.string().min(3),
  }),
});

/**
 * Prompt evaluate-response v0.3 : forme de la réponse.
 * reasoning (raisonnement étape par étape, écrit en premier) peut citer le besoin caché :
 * il n'est jamais enregistré ni renvoyé au front-end.
 */
export const responseEvaluationSchema = z.object({
  reasoning: z.string().min(20).max(2000),
  score: z.number().int().min(0).max(100),
  expectedDecision: z.enum(['ACCEPT', 'NEGOTIATE', 'REFUSE']),
  feedback: z.string().min(10),
  clientReaction: z.string().min(3),
});

// ---------- Protection du besoin caché ----------

/** Nombre de mots consécutifs d'un secret à partir duquel un texte est considéré comme une recopie. */
const LEAK_WINDOW = 6;

const normalize = (text) =>
  ` ${String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;

/** Vrai si le texte recopie un secret en entier ou une suite de LEAK_WINDOW mots consécutifs. */
export function revealsSecret(text, secrets) {
  const haystack = normalize(text);
  return secrets.some((secret) => {
    const words = normalize(secret).trim().split(' ').filter(Boolean);
    if (words.length === 0) return false;
    const size = Math.min(LEAK_WINDOW, words.length);
    if (size < 3) return false;
    for (let start = 0; start + size <= words.length; start += 1) {
      if (haystack.includes(` ${words.slice(start, start + size).join(' ')} `)) return true;
    }
    return false;
  });
}

/**
 * Schéma de l'évaluation pour un scénario donné : la réponse est refusée si le retour
 * pédagogique ou la réaction du client recopie le besoin caché ou une contrainte implicite
 * (callLLM redemande alors une évaluation).
 */
export function createResponseEvaluationSchema({ hiddenNeed = '', implicitConstraints = [] } = {}) {
  const secrets = [hiddenNeed, ...(Array.isArray(implicitConstraints) ? implicitConstraints : [])].filter(Boolean);
  return responseEvaluationSchema.superRefine((evaluation, ctx) => {
    for (const field of ['feedback', 'clientReaction']) {
      if (revealsSecret(evaluation[field], secrets)) {
        ctx.addIssue({ code: 'custom', path: [field], message: 'Le retour révèle le besoin caché' });
      }
    }
  });
}
