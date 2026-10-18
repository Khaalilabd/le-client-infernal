// Réponse simulée du prompt evaluate-document (mode sans clé API).
// L'évaluation est calculée à partir du contenu réel du cahier des charges (nombre et type
// d'exigences, format des user stories, termes vagues, priorités) : elle est donc crédible
// pour la démo et change quand l'étudiant améliore son document.
// Le mock n'utilise jamais le besoin caché : ses pistes restent générales.
import { EVALUATION_GRID } from '../requirements.grid.js';

const VAGUE_TERMS = [
  'rapide', 'rapidement', 'simple', 'facile', 'facilement', 'intuitif', 'intuitive', 'convivial', 'conviviale',
  'ergonomique', 'moderne', 'performant', 'performante', 'efficace', 'optimal', 'optimale', 'etc', 'beaucoup',
  'plusieurs', 'environ', 'si possible', 'user-friendly',
];
const USER_STORY_FORMAT = /en tant qu[e'’].+je (veux|souhaite|voudrais).+afin (de|d['’]|que)/i;
const TESTABLE_HINT = /\d|doit|doivent|permet/i;

function parseRequirements(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const clamp = (value, max) => Math.max(0, Math.min(max, Math.round(value)));
const ratio = (part, total) => (total === 0 ? 0 : part / total);
// Accord en nombre : plural(2, 'exigence non fonctionnelle', 'exigences non fonctionnelles')
const plural = (count, singular, pluralForm = `${singular}s`) => `${count} ${count > 1 ? pluralForm : singular}`;

function findVagueTerms(requirements) {
  const found = new Set();
  for (const { title = '', description = '' } of requirements) {
    const text = ` ${`${title} ${description}`.toLowerCase().replace(/[^\p{L}\s-]/gu, ' ')} `;
    for (const term of VAGUE_TERMS) if (text.includes(` ${term} `)) found.add(term);
  }
  return [...found];
}

export function buildEvaluation(requirements) {
  const total = requirements.length;
  const byType = (type) => requirements.filter((requirement) => requirement.type === type);
  const functional = byType('FUNCTIONAL');
  const nonFunctional = byType('NON_FUNCTIONAL');
  const stories = byType('USER_STORY');

  // 1. Couverture : volume et diversité des exigences (le mock ne connaît pas le besoin caché)
  const typesCovered = [functional, nonFunctional, stories].filter((list) => list.length > 0).length;
  const coverage = clamp(4 + Math.min(total, 8) * 2.2 + typesCovered * 2, 30);

  // 2. Contraintes implicites : souvent traduites en exigences non fonctionnelles
  const constraints = clamp([2, 6, 10, 13, 15][Math.min(nonFunctional.length, 4)], 15);

  // 3. Clarté : descriptions suffisamment détaillées et vérifiables
  const clearCount = requirements.filter(
    (requirement) => (requirement.description ?? '').length >= 40 && TESTABLE_HINT.test(requirement.description),
  ).length;
  const clarity = clamp(total === 0 ? 2 : 6 + 14 * ratio(clearCount, total), 20);

  // 4. Ambiguïtés : termes vagues non chiffrés
  const vagueTerms = findVagueTerms(requirements);
  const ambiguity = clamp(total === 0 ? 3 : 15 - 3 * vagueTerms.length, 15);

  // 5. User stories : format et critères d'acceptation
  const wellFormed = stories.filter((story) => USER_STORY_FORMAT.test(story.description ?? '')).length;
  const withCriteria = stories.filter((story) => story.acceptanceCriteria?.length > 0).length;
  const userStories = clamp(stories.length === 0 ? 2 : 5 * ratio(wellFormed, stories.length) + 5 * ratio(withCriteria, stories.length), 10);

  // 6. Priorisation : des MUST, mais pas uniquement
  const priorities = new Set(requirements.map((requirement) => requirement.priority));
  const mustShare = ratio(requirements.filter((requirement) => requirement.priority === 'MUST').length, total);
  let prioritization = 2;
  if (total > 0) {
    if (priorities.size === 1) prioritization = 4;
    else if (!priorities.has('MUST')) prioritization = 5;
    else if (mustShare > 0.7) prioritization = 6;
    else prioritization = 9;
  }

  const comments = [
    total === 0
      ? 'Le cahier des charges est vide : aucun besoin n\'est couvert.'
      : `${plural(total, 'exigence')} rédigée${total > 1 ? 's' : ''} : ${plural(functional.length, 'fonctionnelle')}, ${plural(nonFunctional.length, 'non fonctionnelle')}, ${plural(stories.length, 'user story', 'user stories')}. Vérifiez qu'elles répondent au problème de fond du client, pas seulement à sa demande initiale.`,
    nonFunctional.length === 0
      ? 'Aucune exigence non fonctionnelle : les contraintes du quotidien du client ne sont pas traduites.'
      : `${plural(nonFunctional.length, 'exigence non fonctionnelle', 'exigences non fonctionnelles')} : ${nonFunctional.length >= 3 ? 'bonne attention aux contraintes.' : 'd\'autres contraintes restent sans doute à identifier.'}`,
    total === 0
      ? 'Rien à évaluer.'
      : `${clearCount} exigence${clearCount > 1 ? 's' : ''} sur ${total} ${clearCount > 1 ? 'sont détaillées et vérifiables' : 'est détaillée et vérifiable'}. Formulez « Le système doit… » avec un résultat mesurable.`,
    vagueTerms.length === 0
      ? (total === 0 ? 'Rien à évaluer.' : 'Pas de terme vague repéré.')
      : `Termes vagues à chiffrer ou préciser : ${vagueTerms.slice(0, 4).map((term) => `« ${term} »`).join(', ')}.`,
    stories.length === 0
      ? 'Aucune user story : ajoutez-en pour décrire le point de vue des utilisateurs.'
      : `${wellFormed}/${stories.length} au format « En tant que… je veux… afin de… », ${withCriteria}/${stories.length} avec critères d'acceptation.`,
    total === 0
      ? 'Rien à prioriser.'
      : priorities.size === 1
        ? 'Toutes les exigences ont la même priorité : distinguez l\'indispensable du souhaitable.'
        : mustShare > 0.7
          ? 'Trop d\'exigences en MUST : tout ne peut pas être indispensable.'
          : 'Priorités MoSCoW variées et globalement cohérentes.',
  ];

  const scores = [coverage, constraints, clarity, ambiguity, userStories, prioritization];
  const criteria = EVALUATION_GRID.map((criterion, index) => ({
    name: criterion.name,
    score: scores[index],
    maxScore: criterion.maxScore,
    comment: comments[index],
  }));
  const globalScore = scores.reduce((sum, score) => sum + score, 0);

  const missingPoints = [];
  if (nonFunctional.length < 3) missingPoints.push('Pensez aux conditions réelles dans lesquelles les utilisateurs se serviront de l\'outil.');
  missingPoints.push('Interrogez-vous sur ce qui fait réellement perdre du temps ou de l\'argent au client aujourd\'hui.');
  if (vagueTerms.length > 0) missingPoints.push('Remplacez les adjectifs vagues par des seuils mesurables (délai, volume, nombre d\'utilisateurs).');
  if (stories.length > 0 && withCriteria < stories.length) missingPoints.push('Ajoutez des critères d\'acceptation à chaque user story.');
  if (stories.length === 0) missingPoints.push('Décrivez au moins un parcours utilisateur sous forme de user story.');

  const feedback =
    total === 0
      ? 'Le cahier des charges est encore vide. Repartez des notes de votre entretien pour rédiger vos premières exigences.'
      : globalScore >= 70
        ? 'Cahier des charges solide et bien structuré. Affinez encore la testabilité et vérifiez que le problème de fond du client est entièrement traité.'
        : globalScore >= 45
          ? 'Bonne base de travail. Creusez davantage les contraintes du quotidien du client et rendez vos exigences plus mesurables.'
          : 'Le document reste trop proche de la demande initiale. Revenez sur ce que le client vit au quotidien et précisez vos exigences.';

  return { globalScore, criteria, feedback, missingPoints: missingPoints.slice(0, 4) };
}

export default function evaluateDocumentMock({ variables }) {
  return buildEvaluation(parseRequirements(variables?.requirements));
}
