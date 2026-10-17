// Accès SERVEUR UNIQUEMENT au scénario complet (besoin caché inclus).
// Le résultat sert à construire les prompts envoyés au LLM : il ne doit jamais
// être renvoyé tel quel dans une réponse API.
import { prisma } from './prisma.js';
import { AppError } from '../errors/AppError.js';
import { SECRET_SCENARIO_FIELDS } from '../serializers/scenario.js';

const includeSecrets = Object.fromEntries(SECRET_SCENARIO_FIELDS.map((field) => [field, false]));

export async function getScenarioSecrets(scenarioId) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    omit: includeSecrets,
  });
  if (!scenario) {
    throw AppError.notFound('Scénario introuvable');
  }
  return scenario;
}
