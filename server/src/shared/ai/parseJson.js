// Extraction du JSON dans la réponse texte d'un LLM
// (gère les blocs ```json ... ``` et le texte parasite autour de l'objet).
import { AiError } from './errors.js';

export function parseJsonResponse(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new AiError('AI_INVALID_RESPONSE', "Réponse vide de l'IA.", { retryable: true });
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        // on tombe sur l'erreur ci-dessous
      }
    }
  }
  throw new AiError('AI_INVALID_RESPONSE', "La réponse de l'IA n'est pas un JSON valide.", { retryable: true });
}
