// Mock pour le prompt recommend-scenario
// Utilisé quand AI_PROVIDER=mock (pas besoin de clé API)
// Comme le LLM : repère d'abord les points faibles, puis recommande un scénario
// (domaine et personnalité choisis parmi ceux du module 1). Conforme à recommendationSchema.
import { RECOMMENDABLE_DOMAINS } from '../dashboard.schemas.js';

const MIN_QUESTIONS = 8;
const PASSING_SCORE = 60;
const GOOD_SCORE = 75;

function averageOf(sessions, field) {
  const values = sessions.map((session) => session[field]).filter((value) => typeof value === 'number');
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export default function recommendScenarioMock({ variables }) {
  const history = JSON.parse(variables.history || '[]');

  const avgScore = averageOf(history, 'finalScore') ?? 0;
  const avgQuestions = averageOf(history, 'interviewQuestions') ?? 0;
  const avgRequirements = averageOf(history, 'requirementsScore');
  const avgChangeRequests = averageOf(history, 'changeRequestsScore');

  // 1. Points faibles
  const weaknesses = [];
  if (avgQuestions < MIN_QUESTIONS) weaknesses.push('Entretien trop court (peu de questions posées)');
  if (avgRequirements !== null && avgRequirements < PASSING_SCORE) weaknesses.push('Exigences incomplètes ou imprécises');
  if (avgChangeRequests !== null && avgChangeRequests < PASSING_SCORE) weaknesses.push('Gestion des demandes de changement à améliorer');
  if (weaknesses.length === 0) weaknesses.push('Aucune faiblesse majeure détectée');

  // 2. Domaine suggéré pas encore pratiqué
  const practiced = new Set(history.map((session) => String(session.domain).toLowerCase()));
  const domain = RECOMMENDABLE_DOMAINS.find((item) => !practiced.has(item.toLowerCase())) ?? RECOMMENDABLE_DOMAINS[0];

  // 3. Niveau
  const levels = history.map((session) => session.level);
  let level = 'BEGINNER';
  if (avgScore > GOOD_SCORE && !levels.includes('ADVANCED')) {
    level = levels.includes('INTERMEDIATE') ? 'ADVANCED' : 'INTERMEDIATE';
  } else if (avgScore > PASSING_SCORE && !levels.includes('INTERMEDIATE')) {
    level = 'INTERMEDIATE';
  }

  // 4. Compétence ciblée, justification et personnalité
  let focusSkill = 'Recueil des besoins';
  let rationale = 'Continuez à vous entraîner pour consolider vos compétences sur un nouveau domaine.';
  let personality;
  if (avgQuestions < MIN_QUESTIONS) {
    focusSkill = 'Découverte du besoin caché';
    rationale = `Vous posez en moyenne ${Math.round(avgQuestions)} questions par entretien. Face à un client méfiant, posez davantage de questions ouvertes pour découvrir son vrai besoin.`;
    personality = 'SKEPTICAL';
  } else if (avgRequirements !== null && avgRequirements < PASSING_SCORE) {
    focusSkill = 'Rédaction des exigences';
    rationale = 'Vos cahiers des charges sont incomplets. Pensez à détailler les critères d\'acceptation et à couvrir toutes les contraintes.';
  } else if (avgChangeRequests !== null && avgChangeRequests < PASSING_SCORE) {
    focusSkill = 'Évaluation critique des changements';
    rationale = 'Vous avez des difficultés à évaluer les demandes de changement. Face à un client qui change d\'avis, analysez bien l\'impact avant d\'accepter ou de refuser.';
    personality = 'CONTRADICTORY';
  } else if (avgScore > GOOD_SCORE) {
    focusSkill = 'Gestion de contraintes complexes';
    rationale = `Excellents résultats (moyenne ${Math.round(avgScore)}/100) ! Passez à un niveau plus exigeant pour découvrir des besoins plus complexes.`;
  }

  return { weaknesses: weaknesses.slice(0, 3), domain, level, ...(personality ? { personality } : {}), focusSkill, rationale };
}
