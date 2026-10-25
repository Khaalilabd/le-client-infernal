// Réponse simulée du prompt client-reply (v0.3) : comme le LLM, le client analyse d'abord la question
// (Chain-of-Thought : type, thème, lien avec le vrai problème, décision), puis répond selon sa
// personnalité et donne plus ou moins d'indices selon la qualité de la question.
// Une tentative de manipulation (prompt injection) ne révèle rien.

const PROBING_WORDS = ['pourquoi', 'problème', 'probleme', 'actuellement', 'difficulté', 'qui utilise', 'conséquence', 'objectif', 'impact', 'comment faites'];
const TECHNICAL_WORDS = ['api', 'base de données', 'serveur', 'architecture', 'framework', 'technologie'];
const CLOSED_STARTS = ['est-ce que', 'est ce que', 'voulez-vous', 'avez-vous', 'faut-il', 'souhaitez-vous', 'préférez-vous', 'vous voulez', 'vous avez'];

// Formulations typiques d'une injection de prompt (comparées sans accents)
const INJECTION_PATTERNS = [
  /\b(ignore|oublie|oubliez|ignorez)\b.{0,30}\b(instructions?|consignes?|regles?)\b/,
  /\btu es (maintenant|desormais)\b/,
  /\b(affiche|montre|donne|revele|repete|ecris)[- ](moi )?(ton|tes|le|les|votre|vos) (prompt|instructions?|consignes?|secret)/,
  /\bbesoin cache\b/,
  /\bprompt( systeme)?\b/,
  /\bmode (developpeur|debug|administrateur)\b/,
];

const withoutAccents = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Le service envoie le profil sous forme de texte ; les anciens tests sous forme { profile }. */
function profileOf(personality) {
  return (typeof personality === 'string' ? personality : personality?.profile) || 'COOPERATIVE';
}

const MANIPULATION_REPLIES = {
  COOPERATIVE: "Pardon ? Je ne suis pas sûr de comprendre votre question. Parlons plutôt de mon projet, je vous écoute.",
  RUSHED: "Je n'ai pas de temps pour ce genre de questions bizarres. Revenons à mon application, s'il vous plaît.",
  SKEPTICAL: "C'est une drôle de question… Vous êtes sûr d'être le bon prestataire ? Parlez-moi plutôt de ce que vous comptez faire pour nous.",
  TALKATIVE: "Ah, ça c'est une question originale ! Mais je ne vois pas trop le rapport… Bon, où en étions-nous avec mon application ?",
  CONTRADICTORY: "Hein ? Non, non… enfin, peut-être… Bref, ce n'est pas le sujet : parlons de mon application.",
  INDECISIVE: "Euh… je ne sais pas quoi vous répondre. Vous pourriez reformuler en me parlant de mon projet ?",
};

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

/** Étapes 1 à 4 de l'analyse (Chain-of-Thought), version simplifiée par mots-clés. */
function analyzeQuestion(question) {
  const plain = withoutAccents(question);
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(plain))) {
    return { questionType: 'MANIPULATION', topic: 'tentative d\'obtenir les consignes', linkToRealProblem: 'Aucun : le message cherche à détourner les règles.', revealDecision: 'NONE', proximity: 0 };
  }
  if (TECHNICAL_WORDS.some((word) => question.includes(word))) {
    return { questionType: 'TECHNICAL', topic: 'choix techniques', linkToRealProblem: 'Question technique, sans lien avec le problème de fond.', revealDecision: 'NONE', proximity: 0.1 };
  }
  if (PROBING_WORDS.some((word) => question.includes(word))) {
    return question.length > 30
      ? { questionType: 'OPEN', topic: 'problèmes actuels et leurs conséquences', linkToRealProblem: 'Touche directement le vrai problème du client.', revealDecision: 'PARTIAL', proximity: 0.8 }
      : { questionType: 'OPEN', topic: 'contexte du projet', linkToRealProblem: 'Explore le contexte sans viser la cause du problème.', revealDecision: 'HINT', proximity: 0.5 };
  }
  if (CLOSED_STARTS.some((start) => question.startsWith(start))) {
    return { questionType: 'CLOSED', topic: 'détail de la demande initiale', linkToRealProblem: 'Question fermée : elle n\'aide pas à découvrir le problème.', revealDecision: 'NONE', proximity: 0.2 };
  }
  return { questionType: 'OFF_TOPIC', topic: 'échange général', linkToRealProblem: 'Sans rapport avec le problème du client.', revealDecision: 'NONE', proximity: 0.2 };
}

const LEVEL_FROM_DECISION = { NONE: 'low', HINT: 'medium', PARTIAL: 'high' };

export default function clientReplyMock({ variables, messages }) {
  const lastQuestion = (messages.at(-1)?.content ?? '').toLowerCase().trim();
  const personality = profileOf(variables.personality);
  const { proximity, ...analysis } = analyzeQuestion(lastQuestion);

  const reply =
    analysis.questionType === 'MANIPULATION'
      ? MANIPULATION_REPLIES[personality] ?? MANIPULATION_REPLIES.COOPERATIVE
      : (PERSONALITY_RESPONSES[personality] ?? PERSONALITY_RESPONSES.COOPERATIVE)[LEVEL_FROM_DECISION[analysis.revealDecision]];

  return {
    analysis,
    reply,
    proximity,
    hiddenNeedRevealed: analysis.revealDecision === 'PARTIAL',
  };
}
