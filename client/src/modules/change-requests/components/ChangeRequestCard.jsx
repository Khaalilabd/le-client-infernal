import { Link } from 'react-router-dom';

const EFFORT_LABELS = { LOW: 'faible', MEDIUM: 'moyen', HIGH: 'élevé' };

/**
 * Lien avec le cahier des charges (module 4) après une demande acceptée ou négociée :
 * soit la version créée suite à cette demande, soit le bouton pour la créer.
 */
function RequirementsUpdate({ changeRequest, sessionId, version, canUpdate, compact }) {
  if (!sessionId || !['ACCEPT', 'NEGOTIATE'].includes(changeRequest.decision)) return null;
  const requirementsUrl = `/requirements?session=${sessionId}`;

  if (version) {
    return (
      <div className={`cr-requirements-update ${compact ? 'small' : ''}`}>
        ✓ <strong>Version {version.version}</strong> du cahier des charges créée suite à cette demande.{' '}
        <Link to={requirementsUrl}>Voir le cahier des charges</Link>
      </div>
    );
  }
  if (!canUpdate) {
    return <p className="muted small cr-requirements-update">Cahier des charges pas encore mis à jour pour cette demande.</p>;
  }
  return (
    <div className={`cr-requirements-update ${compact ? 'small' : ''}`}>
      <span>Le client attend que le cahier des charges intègre ce changement.</span>
      <Link to={`${requirementsUrl}&changeRequest=${changeRequest.id}`} className="btn btn-sm">
        Mettre à jour le cahier des charges
      </Link>
    </div>
  );
}
const DECISION_LABELS = { ACCEPT: 'Acceptée', NEGOTIATE: 'Négociée', REFUSE: 'Refusée' };
const DECISION_BADGES = { ACCEPT: 'badge-success', NEGOTIATE: 'badge-info', REFUSE: 'badge-danger' };

/**
 * Carte d'une demande de changement.
 * En mode compact (historique latéral) : affiche juste le titre, la note et le feedback.
 * En mode normal (liste principale) : affiche tous les détails.
 */
export default function ChangeRequestCard({ changeRequest, compact = false, index, sessionId, version, canUpdate = false }) {
  const requirementsUpdate = (
    <RequirementsUpdate changeRequest={changeRequest} sessionId={sessionId} version={version} canUpdate={canUpdate} compact={compact} />
  );
  const { title, description, reason, impact, status, decision, score, feedback, clientReaction, createdAt } =
    changeRequest;

  const isAnswered = status === 'ANSWERED';
  const badgeClass = isAnswered ? (DECISION_BADGES[decision] ?? 'badge-info') : 'badge-warning';
  const badgeLabel = isAnswered ? (DECISION_LABELS[decision] ?? decision) : 'En attente';

  if (compact && isAnswered) {
    return (
      <article className="card card-muted cr-history-card">
        <div className="card-header">
          <h4>{title}</h4>
          <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
        </div>
        <div className="cr-score-line">
          <span className="score-value" style={{ fontSize: '1.8rem' }}>{score}</span>
          <span className="score-max">/ 100</span>
        </div>
        {feedback && <p className="small" style={{ margin: '6px 0 0' }}>{feedback}</p>}
        {clientReaction && (
          <p className="small muted" style={{ margin: '6px 0 0' }}>
            <em>Client : « {clientReaction} »</em>
          </p>
        )}
        {requirementsUpdate}
      </article>
    );
  }

  return (
    <article className="card cr-request-card">
      <div className="card-header">
        <div>
          {index !== undefined && (
            <span className="eyebrow">
              Demande n° {index + 1} · {new Date(createdAt).toLocaleDateString('fr-FR')}
            </span>
          )}
          <h3>{title}</h3>
        </div>
        <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
      </div>

      <p>{description}</p>

      {reason && <div className="cr-reason-quote">« {reason} »</div>}

      {impact && (
        <div className="cluster small">
          <span className="chip">Impact : {impact.scope}</span>
          <span className="chip">Effort : {EFFORT_LABELS[impact.effort] ?? impact.effort}</span>
          <span className="chip">Risque : {impact.risk}</span>
        </div>
      )}

      {isAnswered && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div className="cr-score-line">
            <span className="score-value" style={{ fontSize: '2rem' }}>{score}</span>
            <span className="score-max">/ 100</span>
          </div>
          {feedback && <p style={{ marginTop: 'var(--space-2)' }}>{feedback}</p>}
          {clientReaction && (
            <div className="cr-client-reaction">
              <strong>Réaction du client :</strong> « {clientReaction} »
            </div>
          )}
          {requirementsUpdate}
        </div>
      )}
    </article>
  );
}
