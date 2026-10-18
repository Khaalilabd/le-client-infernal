// Affiche une erreur de l'API (ApiError) ou toute autre erreur.
// Pour les erreurs temporaires de l'IA (quota, délai dépassé), un bouton « Réessayer »
// est proposé si onRetry est fourni.
const RETRYABLE_CODES = ['AI_RATE_LIMIT', 'AI_TIMEOUT', 'AI_PROVIDER_ERROR', 'AI_INVALID_RESPONSE', 'NETWORK_ERROR'];

export default function ErrorMessage({ error, onRetry }) {
  if (!error) return null;
  const canRetry = onRetry && RETRYABLE_CODES.includes(error.code);

  return (
    <div className="alert alert-error" role="alert">
      <strong>{error.message ?? 'Une erreur est survenue.'}</strong>
      {Array.isArray(error.details) && error.details.length > 0 && (
        <ul>
          {error.details.map((detail) => (
            <li key={`${detail.path}-${detail.message}`}>
              {detail.path ? `${detail.path} : ` : ''}
              {detail.message}
            </li>
          ))}
        </ul>
      )}
      {canRetry && (
        <div className="alert-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
