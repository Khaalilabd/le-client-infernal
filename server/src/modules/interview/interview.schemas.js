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

export const createClientReplySchema = (hiddenNeed, implicitConstraints = []) =>
  z
    .object({
      /** Réponse du client, affichée à l'étudiant */
      reply: z.string().min(1).max(3000),
      /** Proximité de la question avec le besoin caché, de 0 (hors sujet) à 1 (en plein dedans) */
      proximity: z.number().min(0).max(1),
      /** true si le client vient de révéler (même partiellement) son besoin caché */
      hiddenNeedRevealed: z.boolean(),
    })
    .refine(
      (data) => !containsConsecutiveWords(data.reply, hiddenNeed, 6),
      { message: 'La réponse ne doit pas recopier le besoin caché mot pour mot', path: ['reply'] },
    )
    .refine(
      (data) => !implicitConstraints.some((constraint) => containsConsecutiveWords(data.reply, constraint, 6)),
      { message: 'La réponse ne doit pas recopier une contrainte implicite mot pour mot', path: ['reply'] },
    );

// Version de base pour les tests sans contexte
export const clientReplySchema = z.object({
  reply: z.string().min(1).max(3000),
  proximity: z.number().min(0).max(1),
  hiddenNeedRevealed: z.boolean(),
});

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
});
