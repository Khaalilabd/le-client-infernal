import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { toPublicScenario } from '../../shared/serializers/scenario.js';
import { generatedScenarioSchema } from './client-generator.schemas.js';

const LEVEL_LABELS = {
  BEGINNER: 'débutant',
  INTERMEDIATE: 'intermédiaire',
  ADVANCED: 'avancé',
};

/** Génère un scénario avec le LLM, le valide (Zod), l'enregistre et renvoie sa version publique. */
export async function generateScenario({ domain, level }, user) {
  const generated = await callLLM({
    module: 'client-generator',
    prompt: 'generate-scenario',
    variables: { domain, level: LEVEL_LABELS[level] },
    schema: generatedScenarioSchema,
    userId: user.id,
  });

  const scenario = await prisma.scenario.create({
    data: { ...generated, domain, level, createdById: user.id },
  });
  return toPublicScenario(scenario);
}

export async function listScenarios({ domain, level }) {
  const scenarios = await prisma.scenario.findMany({
    where: {
      ...(domain ? { domain: { contains: domain, mode: 'insensitive' } } : {}),
      ...(level ? { level } : {}),
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
