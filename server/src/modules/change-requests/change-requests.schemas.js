import { z } from 'zod';

// ---------- Entrées HTTP ----------

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

/** À utiliser pour l'endpoint prévu POST /:changeRequestId/respond */
export const respondBodySchema = z.object({
  decision: z.enum(['ACCEPT', 'NEGOTIATE', 'REFUSE']),
  justification: z.string().trim().min(20, 'Justifiez votre décision (20 caractères minimum)').max(3000),
});

// ---------- Sorties du LLM ----------

/** Prompt generate-change */
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

/** Prompt evaluate-response (endpoint à implémenter) */
export const responseEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  expectedDecision: z.enum(['ACCEPT', 'NEGOTIATE', 'REFUSE']),
  feedback: z.string().min(10),
  clientReaction: z.string().min(3),
});
