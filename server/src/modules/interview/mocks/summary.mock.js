// Réponse simulée du prompt summary : analyse l'historique pour générer une synthèse
// basée sur les mots-clés détectés dans les questions de l'étudiant.

const EXPLORATION_KEYWORDS = {
  contexte: ['pourquoi', 'actuellement', 'comment faites', 'comment gérez'],
  problèmes: ['problème', 'difficulté', 'souci', 'contrainte'],
  utilisateurs: ['qui utilise', 'utilisateur', 'équipe', 'qui travaille'],
  impact: ['conséquence', 'impact', 'résultat', 'effet'],
};

export default function summaryMock({ variables = {}, messages }) {
  const studentMessages = messages.filter((msg) => msg.role === 'user');
  const questionsAsked = studentMessages.length;
  const allQuestions = studentMessages.map((msg) => msg.content.toLowerCase()).join(' ');
  
  const discoveredPoints = [];
  
  // Analyse les questions pour détecter ce qui a été exploré
  if (EXPLORATION_KEYWORDS.contexte.some((kw) => allQuestions.includes(kw))) {
    discoveredPoints.push("Le contexte actuel du client et sa façon de travailler");
  }
  
  if (EXPLORATION_KEYWORDS.problèmes.some((kw) => allQuestions.includes(kw))) {
    discoveredPoints.push("Les difficultés rencontrées avec le système actuel");
  }
  
  if (EXPLORATION_KEYWORDS.utilisateurs.some((kw) => allQuestions.includes(kw))) {
    discoveredPoints.push("Les utilisateurs concernés et leur organisation");
  }
  
  if (EXPLORATION_KEYWORDS.impact.some((kw) => allQuestions.includes(kw))) {
    discoveredPoints.push("L'impact des problèmes actuels sur l'activité");
  }
  
  // Si peu de découvertes, ajouter un point générique
  if (discoveredPoints.length === 0) {
    discoveredPoints.push("La demande initiale du client");
  }
  
  // Génère un feedback qualitatif
  let qualityFeedback = '';
  const hasOpenQuestions = EXPLORATION_KEYWORDS.contexte.some((kw) => allQuestions.includes(kw));
  const exploredProblems = EXPLORATION_KEYWORDS.problèmes.some((kw) => allQuestions.includes(kw));
  
  if (questionsAsked < 5) {
    qualityFeedback = "L'entretien a été court. Poser davantage de questions permet de mieux comprendre le contexte et les vrais besoins du client.";
  } else if (!hasOpenQuestions) {
    qualityFeedback = "Les questions posées étaient principalement fermées ou techniques. Explorer le contexte avec des questions ouvertes (« pourquoi », « comment actuellement ») révèle souvent les besoins cachés.";
  } else if (!exploredProblems) {
    qualityFeedback = "Bon début d'exploration du contexte. Approfondir les problèmes actuels et leurs conséquences aurait permis de découvrir le véritable besoin du client.";
  } else {
    qualityFeedback = "Bon travail d'exploration ! Les questions ouvertes ont permis de faire émerger des informations importantes sur le contexte et les problèmes du client.";
  }

  // Répartition des questions issue de l'analyse du client (prompt v0.2)
  if (variables.questionTypes && variables.questionTypes !== 'non disponible') {
    qualityFeedback += ` Répartition de vos questions : ${variables.questionTypes}.`;
  }

  return {
    discoveredPoints,
    questionsAsked,
    qualityFeedback,
  };
}
