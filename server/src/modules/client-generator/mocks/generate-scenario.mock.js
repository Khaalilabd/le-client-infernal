// Réponse simulée du prompt generate-scenario (fournisseur mock, aucune clé API nécessaire).
export default function generateScenarioMock({ variables }) {
  return {
    title: `Application de gestion pour une structure du domaine « ${variables.domain} »`,
    clientName: 'Mme Salma Trabelsi',
    clientRole: 'Directrice générale',
    companyName: 'Groupe Horizon Fictif',
    personality: {
      traits: ['pressée', 'méfiante envers la technologie', 'perfectionniste'],
      communicationStyle: 'Phrases courtes, change souvent de sujet',
      mood: 'stressée',
    },
    context:
      "Le Groupe Horizon Fictif gère ses activités avec des fichiers Excel partagés par email. " +
      'Les erreurs de saisie se multiplient et les équipes perdent du temps à consolider les données. ' +
      'La direction veut moderniser ses outils avant la fin du trimestre.',
    expressedNeed: 'Je veux une application pour remplacer nos fichiers Excel.',
    hiddenNeed:
      'Réduire les conflits entre les équipes causés par des données contradictoires : il faut une source unique de vérité avec un historique des modifications.',
    implicitConstraints: [
      'Les employés utilisent principalement des tablettes sur le terrain',
      'Budget limité, aucune licence payante supplémentaire',
    ],
  };
}
