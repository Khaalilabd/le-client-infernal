// Client Prisma unique pour tout le serveur.
// Les champs secrets du scénario sont omis PAR DÉFAUT de toutes les requêtes :
// pour les lire, utiliser getScenarioSecrets() (voir scenarioSecrets.js).
import { PrismaClient } from '@prisma/client';
import { SECRET_SCENARIO_FIELDS } from '../serializers/scenario.js';

const omitSecrets = Object.fromEntries(SECRET_SCENARIO_FIELDS.map((field) => [field, true]));

export const prisma = new PrismaClient({
  omit: { scenario: omitSecrets },
});
