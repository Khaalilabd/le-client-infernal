// Champs du scénario qui ne doivent JAMAIS quitter le serveur.
export const SECRET_SCENARIO_FIELDS = ['hiddenNeed', 'implicitConstraints'];

/**
 * Version publique d'un scénario, envoyable au front-end.
 * À utiliser dans toutes les réponses API qui contiennent un scénario.
 */
export function toPublicScenario(scenario) {
  if (!scenario) return scenario;
  const publicScenario = { ...scenario };
  for (const field of SECRET_SCENARIO_FIELDS) {
    delete publicScenario[field];
  }
  return publicScenario;
}
