// Réponses simulées du prompt evaluate-response v0.2 (variées selon la décision de l'étudiant).

const RESPONSES = {
  ACCEPT: {
    score: 62,
    expectedDecision: 'NEGOTIATE',
    feedback:
      "Accepter sans condition une demande à fort impact risque de déstabiliser le planning. Analysez toujours l'effort et le risque avant d'accepter, et proposez si possible un calendrier de livraison précis.",
    clientReaction: "Parfait, je compte sur vous pour tenir les délais. Ça ne doit pas prendre plus d'une semaine !",
  },
  NEGOTIATE: {
    score: 78,
    expectedDecision: 'NEGOTIATE',
    feedback:
      "Bonne analyse de l'impact et alternative concrète proposée. Pour renforcer votre réponse, chiffrez le délai supplémentaire et précisez quel lot sera affecté.",
    clientReaction: "D'accord, si c'est livré dans les six semaines, ça me convient. Tenez-moi au courant.",
  },
  REFUSE: {
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
