const EFFORT_LABELS = { LOW: 'faible', MEDIUM: 'moyen', HIGH: 'élevé' };
const DECISION_LABELS = { ACCEPT: 'Acceptée', NEGOTIATE: 'Négociée', REFUSE: 'Refusée' };
const DECISION_BADGES = { ACCEPT: 'badge-success', NEGOTIATE: 'badge-info', REFUSE: 'badge-danger' };

/**
 * Carte d'une demande de changement.
 * En mode compact (historique latéral) : affiche juste le titre, la note et le feedback.
 * En mode normal (liste principale) : affiche tous les détails.
 */
export default function ChangeRequestCard({ changeRequest, compact = false, index }) {
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
        </div>
      )}
    </article>
  );
}
