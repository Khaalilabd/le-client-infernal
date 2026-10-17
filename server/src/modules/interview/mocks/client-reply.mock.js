// Réponse simulée du prompt client-reply : le client donne un indice si la question
// contient des mots-clés « d'exploration » (pourquoi, problème, actuellement...).
const PROBING_WORDS = ['pourquoi', 'problème', 'probleme', 'actuellement', 'difficulté', 'qui utilise', 'conséquence'];

export default function clientReplyMock({ messages }) {
  const lastQuestion = (messages.at(-1)?.content ?? '').toLowerCase();
  const isProbing = PROBING_WORDS.some((word) => lastQuestion.includes(word));

  if (isProbing) {
    return {
      reply:
        "Bon… pour être honnête, le vrai souci c'est que chaque équipe a sa propre version des chiffres. " +
        'On passe nos réunions à se disputer pour savoir qui a raison.',
      proximity: 0.8,
      hiddenNeedRevealed: false,
    };
  }

  return {
    reply: "Écoutez, je vous l'ai dit : il me faut une application moderne, rapidement. Le reste, c'est votre métier.",
    proximity: 0.2,
    hiddenNeedRevealed: false,
  };
}
