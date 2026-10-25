// Mock pour le prompt recommend-scenario
// Utilisé quand AI_PROVIDER=mock (pas besoin de clé API)
// Doit retourner un objet conforme à recommendationSchema

export default function recommendScenarioMock({ variables }) {
  const history = JSON.parse(variables.history || '[]');

  // Analyser l'historique pour une recommandation cohérente
  const domains = history.map((s) => s.domain);
  const levels = history.map((s) => s.level);
  const avgScore = history.length > 0
    ? history.reduce((sum, s) => sum + (s.finalScore || 0), 0) / history.length
    : 0;

  // Déterminer les points faibles
  const weaknesses = [];
  const avgQuestions = history.length > 0
    ? history.reduce((sum, s) => sum + (s.interviewQuestions || 0), 0) / history.length
    : 0;

  if (avgQuestions < 8) {
    weaknesses.push('Entretien trop court (peu de questions posées)');
  }

  const avgRequirements = history
    .filter((s) => s.requirementsScore !== null)
    .reduce((sum, s) => sum + s.requirementsScore, 0) / 
    (history.filter((s) => s.requirementsScore !== null).length || 1);

  if (avgRequirements < 60) {
    weaknesses.push('Exigences incomplètes ou imprécises');
  }

  const avgChangeRequests = history
    .filter((s) => s.changeRequestsScore !== null)
    .reduce((sum, s) => sum + s.changeRequestsScore, 0) / 
    (history.filter((s) => s.changeRequestsScore !== null).length || 1);

  if (avgChangeRequests < 60) {
    weaknesses.push('Gestion des demandes de changement à améliorer');
  }

  if (weaknesses.length === 0) {
    weaknesses.push('Aucune faiblesse majeure détectée');
  }

  // Choisir un domaine différent
  const allDomains = ['e-commerce', 'santé', 'finance', 'logistique', 'éducation', 'industrie'];
  const unusedDomains = allDomains.filter((d) => !domains.includes(d));
  const recommendedDomain = unusedDomains.length > 0 
    ? unusedDomains[Math.floor(Math.random() * unusedDomains.length)]
    : allDomains[Math.floor(Math.random() * allDomains.length)];

  // Déterminer le niveau
  let recommendedLevel = 'BEGINNER';
  if (avgScore > 75 && !levels.includes('ADVANCED')) {
    recommendedLevel = levels.includes('INTERMEDIATE') ? 'ADVANCED' : 'INTERMEDIATE';
  } else if (avgScore > 60 && !levels.includes('INTERMEDIATE')) {
    recommendedLevel = 'INTERMEDIATE';
  }

  // Déterminer la compétence à travailler
  let focusSkill = 'Recueil des besoins';
  let rationale = 'Continuez à vous entraîner pour améliorer vos compétences.';

  if (avgQuestions < 8) {
    focusSkill = 'Découverte du besoin caché';
    rationale = `Vous posez en moyenne ${Math.round(avgQuestions)} questions par entretien. Essayez de poser plus de questions ouvertes pour découvrir le vrai besoin du client.`;
  } else if (avgRequirements < 60) {
    focusSkill = 'Rédaction des exigences';
    rationale = 'Vos cahiers des charges sont incomplets. Pensez à détailler les critères d\'acceptation et à couvrir toutes les contraintes.';
  } else if (avgChangeRequests < 60) {
    focusSkill = 'Évaluation critique des changements';
    rationale = 'Vous avez des difficultés à évaluer les demandes de changement. Analysez bien l\'impact avant d\'accepter ou refuser.';
  } else if (avgScore > 75) {
    focusSkill = 'Gestion de contraintes complexes';
    rationale = `Excellents résultats (moyenne ${Math.round(avgScore)}/100) ! Passez au niveau ${recommendedLevel.toLowerCase()} pour des besoins plus complexes.`;
  }

  // Personnalité recommandée selon les faiblesses
  let personality = undefined;
  if (avgQuestions < 8) {
    personality = 'RESERVED';
  } else if (avgChangeRequests < 60) {
    personality = 'DEMANDING';
  }

  return {
    weaknesses: weaknesses.slice(0, 3),
    domain: recommendedDomain,
    level: recommendedLevel,
    personality,
    focusSkill,
    rationale,
  };
}
