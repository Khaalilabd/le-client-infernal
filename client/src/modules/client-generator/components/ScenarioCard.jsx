// Carte d'un scénario (version publique : le besoin caché n'est jamais reçu par le client).
import { Link } from 'react-router-dom';

export const LEVEL_LABELS = { BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' };

export default function ScenarioCard({ scenario, personalityLabel, onStart, onDelete }) {
  return (
    <article className="card cg-card">
      <div className="card-header">
        <h3>{scenario.title}</h3>
        <span className={`badge level-${scenario.level.toLowerCase()}`}>{LEVEL_LABELS[scenario.level]}</span>
      </div>
      <div className="cg-card-body">
        <p className="muted small">
          {scenario.domain} · {scenario.clientName}, {scenario.clientRole}
        </p>
        {personalityLabel && (
          <p>
            <span className="chip">Client {personalityLabel.toLowerCase()}</span>
          </p>
        )}
        <p>
          <strong>Demande du client :</strong> « {scenario.expressedNeed} »
        </p>
      </div>
      <div className="card-footer">
        {onDelete && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete(scenario)}>
            Supprimer
          </button>
        )}
        <Link to={`/client-generator/${scenario.id}`} className="btn btn-ghost btn-sm">
          Aperçu
        </Link>
        {onStart && (
          <button type="button" className="btn btn-sm" onClick={() => onStart(scenario)}>
            Démarrer une séance
          </button>
        )}
      </div>
    </article>
  );
}
