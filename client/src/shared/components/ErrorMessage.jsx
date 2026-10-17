// Affiche une erreur de l'API (ApiError) ou toute autre erreur.
export default function ErrorMessage({ error }) {
  if (!error) return null;
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
    </div>
  );
}
