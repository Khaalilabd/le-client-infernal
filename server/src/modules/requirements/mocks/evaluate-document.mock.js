// Réponse simulée du prompt evaluate-document (endpoint à implémenter).
export default function evaluateDocumentMock() {
  return {
    globalScore: 58,
    criteria: [
      { name: 'Couverture du besoin réel', score: 15, maxScore: 30, comment: 'Le besoin exprimé est couvert, le besoin réel partiellement.' },
      { name: 'Contraintes implicites identifiées', score: 8, maxScore: 20, comment: 'Une seule contrainte implicite identifiée.' },
      { name: 'Qualité rédactionnelle', score: 15, maxScore: 20, comment: 'Exigences claires mais certaines non testables.' },
      { name: 'User stories', score: 10, maxScore: 15, comment: "Critères d'acceptation à compléter." },
      { name: 'Priorisation', score: 10, maxScore: 15, comment: 'Priorités globalement cohérentes.' },
    ],
    feedback: 'Bon travail de structuration. Creusez davantage les problèmes concrets vécus par les équipes du client.',
    missingPoints: ['Interrogez-vous sur la cohérence des données entre équipes', "Pensez au matériel utilisé sur le terrain"],
  };
}
