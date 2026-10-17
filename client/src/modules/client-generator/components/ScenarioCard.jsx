// Carte d'un scénario (version publique : le besoin caché n'est jamais reçu par le client).
export const LEVEL_LABELS = { BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' };

export default function ScenarioCard({ scenario, onStart }) {
  return (
    <article className="card">
      <div className="card-header">
        <h3>{scenario.title}</h3>
        <span className={`badge level-${scenario.level.toLowerCase()}`}>{LEVEL_LABELS[scenario.level]}</span>
      </div>
      <p className="muted">
        {scenario.domain} · {scenario.clientName}, {scenario.clientRole} — {scenario.companyName}
      </p>
      <p>{scenario.context}</p>
      <p>
        <strong>Demande du client :</strong> « {scenario.expressedNeed} »
      </p>
      {onStart && (
        <button type="button" className="btn" onClick={() => onStart(scenario)}>
          Démarrer une séance
        </button>
      )}
    </article>
  );
}
