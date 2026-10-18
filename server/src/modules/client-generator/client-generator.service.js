import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { loadPrompt } from '../../shared/ai/promptLoader.js';
import { AppError } from '../../shared/errors/AppError.js';
import { toPublicScenario } from '../../shared/serializers/scenario.js';
import { createGeneratedScenarioSchema } from './client-generator.schemas.js';
import { DOMAIN_SUGGESTIONS, LEVELS, PERSONALITY_PROFILES, getLevel, resolveProfile } from './client-generator.catalog.js';

const MODULE = 'client-generator';
const MAX_EXISTING_TITLES = 20;

/** Options proposées dans le formulaire de génération. */
export function getOptions() {
  return {
    domains: DOMAIN_SUGGESTIONS,
    levels: LEVELS,
    personalities: PERSONALITY_PROFILES.map(({ id, label, description }) => ({ id, label, description })),
  };
}

async function findExistingTitles(domain) {
  const scenarios = await prisma.scenario.findMany({
    where: { domain: { equals: domain, mode: 'insensitive' } },
    select: { title: true },
    orderBy: { createdAt: 'desc' },
    take: MAX_EXISTING_TITLES,
  });
  return scenarios.map((scenario) => scenario.title);
}

/**
 * Génère un scénario avec le LLM, le valide (Zod, règles du niveau), l'enregistre
 * et renvoie sa version publique (sans besoin caché ni contraintes implicites).
 */
export async function generateScenario({ domain, level, personality }, user) {
  const profile = resolveProfile(personality);
  const levelInfo = getLevel(level);
  const existingTitles = await findExistingTitles(domain);

  const generated = await callLLM({
    module: MODULE,
    prompt: 'generate-scenario',
    variables: {
      domain,
      level: levelInfo.label.toLowerCase(),
      levelId: level,
      levelRules: await loadPrompt(MODULE, `level-${level.toLowerCase()}`, {}),
      personalityId: profile.id,
      personalityLabel: profile.label,
      personalityBehavior: profile.behavior,
      existingTitles: existingTitles.length ? existingTitles.map((title) => `- ${title}`).join('\n') : 'Aucun.',
    },
    schema: createGeneratedScenarioSchema(level),
    userId: user.id,
  });

  const scenario = await prisma.scenario.create({
    data: {
      ...generated,
      personality: { ...generated.personality, profile: profile.id },
      domain,
      level,
      createdById: user.id,
    },
  });
  return toPublicScenario(scenario);
}

export async function listScenarios({ domain, level, personality }) {
  const scenarios = await prisma.scenario.findMany({
    where: {
      ...(domain ? { domain: { contains: domain, mode: 'insensitive' } } : {}),
      ...(level ? { level } : {}),
      ...(personality ? { personality: { path: ['profile'], equals: personality } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return scenarios.map(toPublicScenario);
}

export async function getScenario(scenarioId) {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) throw AppError.notFound('Scénario introuvable');
  return toPublicScenario(scenario);
}

/**
 * Supprime un scénario (enseignant). Refusé si des séances l'utilisent :
 * la suppression effacerait en cascade le travail des étudiants.
 */
export async function deleteScenario(scenarioId) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { id: true, _count: { select: { sessions: true } } },
  });
  if (!scenario) throw AppError.notFound('Scénario introuvable');

  const sessionCount = scenario._count.sessions;
  if (sessionCount > 0) {
    throw new AppError(
      409,
      'SCENARIO_IN_USE',
      `Ce scénario est utilisé par ${sessionCount} séance(s) : le supprimer effacerait le travail des étudiants.`,
    );
  }
  await prisma.scenario.delete({ where: { id: scenarioId } });
}
