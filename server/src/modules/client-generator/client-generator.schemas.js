import { z } from 'zod';
import { IMPLICIT_CONSTRAINTS_RANGE, LEVEL_IDS, PROFILE_IDS, RANDOM_PROFILE } from './client-generator.catalog.js';

export const LEVELS = LEVEL_IDS;

// ---------- Entrées HTTP ----------

export const generateScenarioBodySchema = z.object({
  domain: z.string().trim().min(2, 'Domaine requis').max(80),
  level: z.enum(LEVEL_IDS),
  personality: z.enum([...PROFILE_IDS, RANDOM_PROFILE]).default(RANDOM_PROFILE),
});

export const listScenariosQuerySchema = z.object({
  domain: z.string().trim().optional(),
  level: z.enum(LEVEL_IDS).optional(),
  personality: z.enum(PROFILE_IDS).optional(),
});

export const scenarioIdParamsSchema = z.object({
  scenarioId: z.string().min(1),
});

// ---------- Sortie du LLM (prompt generate-scenario) ----------

const normalize = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export const generatedScenarioSchema = z
  .object({
    title: z.string().min(3).max(150),
    clientName: z.string().min(2).max(100),
    clientRole: z.string().min(2).max(100),
    companyName: z.string().min(2).max(100),
    personality: z.object({
      traits: z.array(z.string().min(1)).min(2).max(6),
      communicationStyle: z.string().min(3),
      mood: z.string().min(2),
    }),
    context: z.string().min(40),
    expressedNeed: z.string().min(10),
    hiddenNeed: z.string().min(20),
    implicitConstraints: z.array(z.string().min(5)).min(1).max(6),
    // Identifiants des fiches de la base de connaissances utilisées (RAG, prompt v0.3)
    knowledgeSources: z.array(z.string().min(1)).max(5).default([]),
  })
  .refine((scenario) => normalize(scenario.hiddenNeed) !== normalize(scenario.expressedNeed), {
    path: ['hiddenNeed'],
    message: 'Le besoin caché doit être différent du besoin exprimé',
  });

/**
 * Schéma de la réponse du LLM pour un niveau donné : le nombre de contraintes
 * implicites doit correspondre à la difficulté demandée.
 * Avec allowedSources (identifiants des fiches fournies par le RAG), le LLM doit citer
 * au moins une de ces fiches et aucune autre.
 */
export function createGeneratedScenarioSchema(level, { allowedSources } = {}) {
  const [min, max] = IMPLICIT_CONSTRAINTS_RANGE[level];
  return generatedScenarioSchema
    .refine((scenario) => scenario.implicitConstraints.length >= min && scenario.implicitConstraints.length <= max, {
      path: ['implicitConstraints'],
      message: `Le niveau ${level} demande entre ${min} et ${max} contraintes implicites`,
    })
    .refine((scenario) => !allowedSources || scenario.knowledgeSources.every((id) => allowedSources.includes(id)), {
      path: ['knowledgeSources'],
      message: 'Citez uniquement les identifiants des fiches fournies',
    })
    .refine((scenario) => !allowedSources?.length || scenario.knowledgeSources.length > 0, {
      path: ['knowledgeSources'],
      message: 'Citez au moins une fiche utilisée',
    });
}
