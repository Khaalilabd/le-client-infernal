import { z } from 'zod';

// ---------- Entrées HTTP ----------

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const sendMessageBodySchema = z.object({
  content: z.string().trim().min(1, 'Message vide').max(2000, 'Message trop long (2000 caractères max)'),
});

// ---------- Sortie du LLM (prompt client-reply) ----------

export const clientReplySchema = z.object({
  /** Réponse du client, affichée à l'étudiant */
  reply: z.string().min(1).max(3000),
  /** Proximité de la question avec le besoin caché, de 0 (hors sujet) à 1 (en plein dedans) */
  proximity: z.number().min(0).max(1),
  /** true si le client vient de révéler (même partiellement) son besoin caché */
  hiddenNeedRevealed: z.boolean(),
});
