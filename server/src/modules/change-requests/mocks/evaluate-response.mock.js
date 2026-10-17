// Réponse simulée du prompt evaluate-response (endpoint à implémenter).
export default function evaluateResponseMock() {
  return {
    score: 70,
    expectedDecision: 'NEGOTIATE',
    feedback: "Bonne analyse de l'impact. Proposez une alternative concrète (livraison dans un lot ultérieur) pour rassurer le client.",
    clientReaction: "D'accord, si c'est livré le mois prochain, ça me convient.",
  };
}
