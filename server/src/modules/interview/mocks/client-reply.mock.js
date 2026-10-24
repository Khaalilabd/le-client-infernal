// Réponse simulée du prompt client-reply : le client adapte sa réponse à sa personnalité
// et donne plus ou moins d'indices selon la qualité de la question.

const PROBING_WORDS = ['pourquoi', 'problème', 'probleme', 'actuellement', 'difficulté', 'qui utilise', 'conséquence', 'objectif', 'impact', 'comment faites'];
const TECHNICAL_WORDS = ['api', 'base de données', 'serveur', 'architecture', 'framework', 'technologie'];

// Descriptions des personnalités (correspondant à personalities.json du module 1)
const PERSONALITY_RESPONSES = {
  COOPERATIVE: {
    low: "D'accord. Donc, il me faut une application pour faciliter notre travail quotidien.",
    medium: "Eh bien, pour être honnête, on perd beaucoup de temps avec notre système actuel. Les équipes ne sont pas toujours sur la même longueur d'onde.",
    high: "Exactement ! Le vrai problème, c'est que chaque équipe travaille dans son coin avec ses propres données. On passe nos journées à vérifier qui a raison.",
  },
  RUSHED: {
    low: "Écoutez, je n'ai pas beaucoup de temps. Il me faut une solution rapidement.",
    medium: "Bon, si vous voulez tout savoir : notre méthode actuelle nous fait perdre un temps fou. C'est pour ça que je suis pressé.",
    high: "Voilà ! On gaspille 3 heures par jour à cause de ce problème. Il faut que ça change, vite !",
  },
  SKEPTICAL: {
    low: "Mouais… J'ai déjà entendu ce genre de promesses. Montrez-moi d'abord que vous comprenez notre métier.",
    medium: "Je vois que vous posez les bonnes questions. Effectivement, notre ancien prestataire n'avait pas vu le vrai problème : les données incohérentes entre services.",
    high: "D'accord, vous avez compris. Le dernier prestataire nous a livré un outil qui ne réglait rien parce qu'il n'avait pas vu que le problème venait de la synchronisation entre équipes.",
  },
  TALKATIVE: {
    low: "Ah, vous savez, c'est toute une histoire ! L'autre jour, justement, mon collègue m'a dit… enfin bref, il nous faut une application moderne.",
    medium: "Donc voilà, pour revenir à votre question… Oui, on a des soucis. Par exemple, la semaine dernière, deux équipes avaient des chiffres complètement différents ! On ne sait plus qui croire.",
    high: "Vous avez mis le doigt dessus ! Le vrai souci — et je vous raconte ça parce que ça illustre bien le problème — c'est qu'il n'y a aucune source unique de vérité. Chacun a sa version des données, et du coup, on se dispute tout le temps.",
  },
  CONTRADICTORY: {
    low: "Je veux quelque chose de simple… mais qui fait tout ce dont on a besoin. Vous voyez ?",
    medium: "Bon, d'accord, peut-être que « simple » n'est pas le bon mot. En fait, on a besoin que toutes les équipes voient les mêmes informations. Mais sans compliquer notre façon de travailler actuelle !",
    high: "Écoutez, je sais que je me contredis. Mais le vrai problème, c'est qu'on a des données partout et personne n'est d'accord. Il nous faut UNE seule version, même si ça implique de changer nos habitudes.",
  },
  INDECISIVE: {
    low: "Euh… je ne sais pas trop. Qu'est-ce que vous me conseillez ?",
    medium: "Peut-être que… oui, en y réfléchissant, le problème c'est qu'on n'a pas vraiment de système unifié. Chacun fait à sa façon.",
    high: "Oui, vous avez raison de poser la question comme ça. En fait, le cœur du problème, c'est qu'il n'y a pas de source centrale. Tout le monde a ses propres chiffres et on ne sait plus à qui faire confiance.",
  },
};

export default function clientReplyMock({ variables, messages }) {
  const lastQuestion = (messages.at(-1)?.content ?? '').toLowerCase();
  const personality = variables.personality?.profile || 'COOPERATIVE';
  
  const isProbing = PROBING_WORDS.some((word) => lastQuestion.includes(word));
  const isTechnical = TECHNICAL_WORDS.some((word) => lastQuestion.includes(word));
  const questionLength = lastQuestion.length;
  
  // Détermine le niveau de proximité selon la question
  let proximityLevel = 'low';
  let proximity = 0.2;
  
  if (isTechnical) {
    proximityLevel = 'low';
    proximity = 0.1;
  } else if (isProbing && questionLength > 30) {
    proximityLevel = 'high';
    proximity = 0.8;
  } else if (isProbing) {
    proximityLevel = 'medium';
    proximity = 0.5;
  }
  
  const responses = PERSONALITY_RESPONSES[personality] || PERSONALITY_RESPONSES.COOPERATIVE;
  const reply = responses[proximityLevel];
  
  return {
    reply,
    proximity,
    hiddenNeedRevealed: proximityLevel === 'high',
  };
}
