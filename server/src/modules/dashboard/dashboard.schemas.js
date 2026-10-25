import { z } from 'zod';

// ---------- Entrées HTTP (endpoints prévus) ----------

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const studentIdParamsSchema = z.object({
  studentId: z.string().min(1),
});

export const teacherFeedbackBodySchema = z.object({
  comment: z.string().trim().min(5).max(3000),
  grade: z.number().min(0).max(20).optional(),
});

// ---------- Sortie du LLM (prompt recommend-scenario, endpoint à implémenter) ----------

export const recommendationSchema = z.object({
  weaknesses: z.array(z.string().min(3)).min(1).max(5),
  domain: z.string().min(2),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  personality: z.string().optional(),
  focusSkill: z.string().min(3),
  rationale: z.string().min(10),
});
