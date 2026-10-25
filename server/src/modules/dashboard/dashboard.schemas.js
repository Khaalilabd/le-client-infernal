import { z } from 'zod';
// Lecture seule du catalogue du module 1 : la recommandation doit pouvoir être lancée dans le générateur
import { DOMAIN_SUGGESTIONS, PROFILE_IDS } from '../client-generator/client-generator.catalog.js';

// ---------- Entrées HTTP ----------

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

// ---------- Sortie du LLM (prompt recommend-scenario) ----------

export const RECOMMENDABLE_DOMAINS = DOMAIN_SUGGESTIONS;
export const RECOMMENDABLE_PERSONALITIES = PROFILE_IDS;

export const recommendationSchema = z.object({
  /** Points faibles repérés AVANT la recommandation (le modèle analyse puis recommande) */
  weaknesses: z.array(z.string().min(3)).min(1).max(5),
  /** Un des domaines suggérés par le module 1 */
  domain: z.enum(RECOMMENDABLE_DOMAINS),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  /** Un des profils de personnalité du module 1 (facultatif) */
  personality: z.enum(RECOMMENDABLE_PERSONALITIES).optional(),
  focusSkill: z.string().min(3),
  rationale: z.string().min(10),
});
