// Appel HTTP commun aux fournisseurs, avec traduction des statuts HTTP en AiError.
import { AiError } from '../errors.js';

function parseRetryAfter(header) {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

export async function postJson(url, { providerName, headers = {}, body, signal }) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw signal.reason ?? err;
    throw new AiError('AI_PROVIDER_ERROR', `Fournisseur IA « ${providerName} » injoignable (${url}).`, {
      retryable: true,
      cause: err,
    });
  }

  if (response.ok) {
    return response.json();
  }

  const detail = await response.text().catch(() => '');
  if (response.status === 429) {
    throw new AiError('AI_RATE_LIMIT', undefined, {
      retryable: true,
      retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
    });
  }
  if (response.status === 401 || response.status === 403) {
    throw new AiError('AI_MISSING_KEY', `Clé API refusée par « ${providerName} ». Vérifiez server/.env.`);
  }
  if (response.status >= 500) {
    throw new AiError('AI_PROVIDER_ERROR', `Erreur temporaire du fournisseur « ${providerName} » (${response.status}).`, {
      retryable: true,
    });
  }
  throw new AiError(
    'AI_PROVIDER_ERROR',
    `Requête refusée par « ${providerName} » (${response.status}) : ${detail.slice(0, 200)}`,
  );
}
