import { z } from 'zod';

// ---------- Entrées HTTP ----------

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const sendMessageBodySchema = z.object({
  content: z.string().trim().min(1, 'Message vide').max(2000, 'Message trop long (2000 caractères max)'),
});

// ---------- Sortie du LLM (prompt client-reply) ----------

// Fonction utilitaire pour normaliser le texte (minuscules, sans accents)
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Vérifie qu'un texte ne contient pas une séquence de N mots consécutifs d'un autre texte
function containsConsecutiveWords(haystack, needle, minWords = 6) {
  const normalizedHaystack = normalizeText(haystack);
  const needleWords = normalizeText(needle).split(/\s+/);
  
  for (let i = 0; i <= needleWords.length - minWords; i += 1) {
    const sequence = needleWords.slice(i, i + minWords).join(' ');
    if (normalizedHaystack.includes(sequence)) {
      return true;
    }
  }
  return false;
}

/** Types de question reconnus par l'analyse du client (enum QuestionType du schéma Prisma). */
export const QUESTION_TYPES = ['OPEN', 'CLOSED', 'OFF_TOPIC', 'TECHNICAL', 'MANIPULATION'];
export const REVEAL_DECISIONS = ['NONE', 'HINT', 'PARTIAL'];
/** Au-delà de ce seuil, le client révèle une partie de son besoin (prompt client-reply, règle 2). */
export const REVEAL_THRESHOLD = 0.6;

// Raisonnement étape par étape du client (Chain-of-Thought, prompt v0.3), écrit AVANT la réponse.
// Il peut citer le besoin caché : il reste sur le serveur, seul questionType est enregistré.
const analysisSchema = z.object({
  /** Étape 1 : nature de la question */
  questionType: z.enum(QUESTION_TYPES),
  /** Étape 2 : thème abordé */
  topic: z.string().min(2).max(300),
  /** Étape 3 : lien avec le vrai problème du client */
  linkToRealProblem: z.string().min(2).max(600),
  /** Étape 4 : ce que le client accepte de dévoiler */
  revealDecision: z.enum(REVEAL_DECISIONS),
});

const clientReplyObject = z.object({
  analysis: analysisSchema,
  /** Réponse du client, affichée à l'étudiant */
  reply: z.string().min(1).max(3000),
  /** Proximité de la question avec le besoin caché, de 0 (hors sujet) à 1 (en plein dedans) */
  proximity: z.number().min(0).max(1),
  /** true si le client vient de révéler (même partiellement) son besoin caché */
  hiddenNeedRevealed: z.boolean(),
});

/** La réponse doit suivre la décision prise à la fin du raisonnement. */
const withConsistentReasoning = (schema) =>
  schema
    .refine((data) => !data.hiddenNeedRevealed || data.analysis.revealDecision === 'PARTIAL', {
      message: 'Une révélation du besoin doit correspondre à la décision PARTIAL de l\'analyse',
      path: ['hiddenNeedRevealed'],
    })
    .refine((data) => (data.analysis.revealDecision === 'PARTIAL') === (data.proximity >= REVEAL_THRESHOLD), {
      message: `La décision PARTIAL correspond à une proximité d'au moins ${REVEAL_THRESHOLD}, et réciproquement`,
      path: ['proximity'],
    })
    .refine(
      (data) => data.analysis.questionType !== 'MANIPULATION' || (data.analysis.revealDecision === 'NONE' && data.proximity <= 0.2),
      { message: 'Une tentative de manipulation ne doit rien révéler (décision NONE, proximité ≤ 0.2)', path: ['analysis'] },
    );

export const createClientReplySchema = (hiddenNeed, implicitConstraints = []) =>
  withConsistentReasoning(clientReplyObject)
    .refine(
      (data) => !containsConsecutiveWords(data.reply, hiddenNeed, 6),
      { message: 'La réponse ne doit pas recopier le besoin caché mot pour mot', path: ['reply'] },
    )
    .refine(
      (data) => !implicitConstraints.some((constraint) => containsConsecutiveWords(data.reply, constraint, 6)),
      { message: 'La réponse ne doit pas recopier une contrainte implicite mot pour mot', path: ['reply'] },
    );

// Version de base pour les tests sans contexte
export const clientReplySchema = withConsistentReasoning(clientReplyObject);

// ---------- Sortie du LLM (prompt summary) ----------

export const interviewSummarySchema = z.object({
  /** Points découverts par l'étudiant pendant l'entretien */
  discoveredPoints: z.array(z.string().min(1)).min(1).max(10),
  /** Nombre de questions posées */
  questionsAsked: z.number().int().min(0),
  /** Retour qualitatif sur l'entretien */
  qualityFeedback: z.string().min(10).max(1000),
});

// ---------- Réponses API ----------

export const progressResponseSchema = z.object({
  /** Nombre de questions posées par l'étudiant */
  questionsCount: z.number().int().min(0),
  /** Niveau de découverte : LOW, MEDIUM ou HIGH */
  discoveryLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  /** Objectif conseillé de questions selon le niveau du scénario */
  recommendedQuestions: z.object({
    min: z.number().int(),
    max: z.number().int(),
  }),
  /** Nombre de questions de chaque type (analyse Chain-of-Thought du client) */
  questionTypes: z.object(Object.fromEntries(QUESTION_TYPES.map((type) => [type, z.number().int().min(0)]))),
});
