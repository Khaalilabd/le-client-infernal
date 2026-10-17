// Réponse simulée du prompt recommend-scenario (endpoint à implémenter).
export default function recommendScenarioMock() {
  return {
    domain: 'Santé',
    level: 'INTERMEDIATE',
    focusSkill: 'Découverte du besoin caché',
    rationale: 'Vos cahiers des charges sont bien structurés. Travaillez maintenant vos questions ouvertes face à un client moins coopératif.',
  };
}
