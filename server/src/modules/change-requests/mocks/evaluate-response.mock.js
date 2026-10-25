// Réponses simulées du prompt evaluate-response v0.3 (variées selon la décision de l'étudiant).
// Comme le LLM, chaque évaluation commence par un raisonnement (reasoning), qui reste sur le serveur.
// Le mock répond de façon identique aux 3 évaluations : le vote est donc unanime en mode simulé.

const RESPONSES = {
  ACCEPT: {
    reasoning:
      "La demande touche plusieurs écrans et repousse la livraison. Accepter sans condition fait peser un risque sur le planning. Une négociation (report dans un lot ultérieur) était attendue.",
    score: 62,
    expectedDecision: 'NEGOTIATE',
    feedback:
      "Accepter sans condition une demande à fort impact risque de déstabiliser le planning. Analysez toujours l'effort et le risque avant d'accepter, et proposez si possible un calendrier de livraison précis.",
    clientReaction: "Parfait, je compte sur vous pour tenir les délais. Ça ne doit pas prendre plus d'une semaine !",
  },
  NEGOTIATE: {
    reasoning:
      "La demande a un impact réel sur le délai mais reste utile au client. La négociation protège le planning tout en répondant à la demande : c'est la décision attendue. La justification propose une alternative.",
    score: 78,
    expectedDecision: 'NEGOTIATE',
    feedback:
      "Bonne analyse de l'impact et alternative concrète proposée. Pour renforcer votre réponse, chiffrez le délai supplémentaire et précisez quel lot sera affecté.",
    clientReaction: "D'accord, si c'est livré dans les six semaines, ça me convient. Tenez-moi au courant.",
  },
  REFUSE: {
    reasoning:
      "La demande est importante pour l'activité du client. Un refus sans alternative risque de dégrader la relation. Une négociation aurait permis de préserver le planning et la confiance.",
    score: 55,
    expectedDecision: 'NEGOTIATE',
    feedback:
      "Refuser sans proposer d'alternative risque de braquer le client. Préférez une négociation : reportez dans un lot ultérieur ou proposez une version simplifiée de la fonctionnalité.",
    clientReaction: "Je ne comprends pas pourquoi vous refusez. C'est pourtant essentiel pour mon activité !",
  },
};

/** Réponse simulée : varie selon la décision de l'étudiant */
export default function evaluateResponseMock({ variables }) {
  const decision = variables?.decision ?? 'NEGOTIATE';
  return RESPONSES[decision] ?? RESPONSES.NEGOTIATE;
}
