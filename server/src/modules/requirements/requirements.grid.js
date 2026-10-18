// Grille d'évaluation du cahier des charges (total 100).
// Source unique : utilisée par le prompt evaluate-document, le schéma Zod et le mock.
// Grille officielle du projet (couverture, clarté, ambiguïtés) complétée par les critères de la maquette 06.
export const EVALUATION_GRID = [
  {
    name: 'Couverture du besoin réel',
    maxScore: 30,
    question: 'Les exigences répondent-elles au véritable besoin du client, et pas seulement au besoin exprimé ?',
  },
  {
    name: 'Contraintes implicites identifiées',
    maxScore: 15,
    question: 'Combien de contraintes implicites ont été traduites en exigences (souvent non fonctionnelles) ?',
  },
  {
    name: 'Clarté et testabilité',
    maxScore: 20,
    question: 'Chaque exigence est-elle compréhensible, atomique et vérifiable par un test ?',
  },
  {
    name: 'Absence d\'ambiguïtés',
    maxScore: 15,
    question: 'Les termes vagues (« rapide », « simple », « intuitif », « etc. ») sont-ils évités ou chiffrés ?',
  },
  {
    name: 'User stories et critères d\'acceptation',
    maxScore: 10,
    question: 'Les user stories suivent-elles le format « En tant que… je veux… afin de… » avec des critères d\'acceptation ?',
  },
  {
    name: 'Priorisation MoSCoW',
    maxScore: 10,
    question: 'Les priorités MUST / SHOULD / COULD / WONT sont-elles cohérentes avec le besoin réel ?',
  },
];

export const GRID_TOTAL = EVALUATION_GRID.reduce((total, criterion) => total + criterion.maxScore, 0);

/** Texte de la grille inséré dans le prompt. */
export function gridToText() {
  return EVALUATION_GRID.map(
    (criterion, index) => `${index + 1}. ${criterion.name} (${criterion.maxScore} points) : ${criterion.question}`,
  ).join('\n');
}
