import { z } from 'zod';

export const REQUIREMENT_TYPES = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'USER_STORY'];
export const PRIORITIES = ['MUST', 'SHOULD', 'COULD', 'WONT'];

// ---------- Entrées HTTP ----------

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const requirementInputSchema = z.object({
  type: z.enum(REQUIREMENT_TYPES),
  code: z.string().trim().min(1).max(20),
  title: z.string().trim().min(3, 'Titre trop court').max(150),
  description: z.string().trim().min(5, 'Description trop courte').max(3000),
  priority: z.enum(PRIORITIES).default('SHOULD'),
  acceptanceCriteria: z.array(z.string().trim().min(1)).max(20).optional(),
});

export const saveDocumentBodySchema = z.object({
  requirements: z.array(requirementInputSchema).max(200),
});

// ---------- Sortie du LLM (prompt evaluate-document, endpoint à implémenter) ----------

export const documentEvaluationSchema = z.object({
  globalScore: z.number().int().min(0).max(100),
  criteria: z
    .array(
      z.object({
        name: z.string().min(2),
        score: z.number().min(0),
        maxScore: z.number().positive(),
        comment: z.string().min(3),
      }),
    )
    .min(1),
  feedback: z.string().min(10),
  missingPoints: z.array(z.string().min(3)),
});
