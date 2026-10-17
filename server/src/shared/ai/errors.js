// Erreurs du service IA. Chaque code correspond à un statut HTTP et à un message clair
// affiché à l'utilisateur par le gestionnaire d'erreurs.

export const AI_ERRORS = {
  AI_TIMEOUT: { status: 504, message: "Le service IA n'a pas répondu à temps. Réessayez." },
  AI_RATE_LIMIT: { status: 429, message: 'Quota du fournisseur IA dépassé (429). Réessayez dans quelques instants.' },
  AI_MISSING_KEY: { status: 503, message: 'Clé API du fournisseur IA absente ou refusée. Vérifiez server/.env.' },
  AI_INVALID_RESPONSE: { status: 502, message: "La réponse de l'IA est invalide (format inattendu)." },
  AI_PROVIDER_ERROR: { status: 502, message: 'Le fournisseur IA a renvoyé une erreur.' },
  AI_PROMPT_ERROR: { status: 500, message: 'Prompt système introuvable ou incomplet.' },
};

export class AiError extends Error {
  /**
   * @param {keyof AI_ERRORS} code
   * @param {string} [message] message précis (sinon message par défaut du code)
   * @param {{ retryable?: boolean, retryAfterMs?: number, cause?: unknown }} [options]
   */
  constructor(code, message, { retryable = false, retryAfterMs, cause } = {}) {
    const definition = AI_ERRORS[code] ?? AI_ERRORS.AI_PROVIDER_ERROR;
    super(message ?? definition.message, { cause });
    this.name = 'AiError';
    this.code = AI_ERRORS[code] ? code : 'AI_PROVIDER_ERROR';
    this.status = definition.status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Convertit n'importe quelle erreur en AiError. */
export function toAiError(err) {
  if (err instanceof AiError) return err;
  return new AiError('AI_PROVIDER_ERROR', undefined, { retryable: true, cause: err });
}
