import { z } from 'zod';

export const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

// ---------- Entrées HTTP ----------

export const generateScenarioBodySchema = z.object({
  domain: z.string().trim().min(2, 'Domaine requis').max(80),
  level: z.enum(LEVELS),
});

export const listScenariosQuerySchema = z.object({
  domain: z.string().trim().optional(),
  level: z.enum(LEVELS).optional(),
});

export const scenarioIdParamsSchema = z.object({
  scenarioId: z.string().min(1),
});

// ---------- Sortie du LLM (prompt generate-scenario) ----------

export const generatedScenarioSchema = z.object({
  title: z.string().min(3).max(150),
  clientName: z.string().min(2).max(100),
  clientRole: z.string().min(2).max(100),
  companyName: z.string().min(2).max(100),
  personality: z.object({
    traits: z.array(z.string().min(1)).min(1).max(6),
    communicationStyle: z.string().min(3),
    mood: z.string().min(2),
  }),
  context: z.string().min(20),
  expressedNeed: z.string().min(10),
  hiddenNeed: z.string().min(10),
  implicitConstraints: z.array(z.string().min(3)).min(1).max(8),
});
