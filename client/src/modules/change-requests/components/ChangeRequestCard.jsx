const EFFORT_LABELS = { LOW: 'Faible', MEDIUM: 'Moyen', HIGH: 'Élevé' };
const DECISION_LABELS = { ACCEPT: 'Acceptée', NEGOTIATE: 'Négociée', REFUSE: 'Refusée' };

export default function ChangeRequestCard({ changeRequest }) {
  const { title, description, reason, impact, status, decision, score, feedback } = changeRequest;
  return (
    <article className="card">
      <div className="card-header">
        <h3>{title}</h3>
        <span className="badge">{status === 'PENDING' ? 'En attente' : DECISION_LABELS[decision]}</span>
      </div>
      <p>{description}</p>
      <p className="muted">
        <strong>Raison du client :</strong> {reason}
      </p>
      <p className="muted">
        Impact : {impact.scope} · effort {EFFORT_LABELS[impact.effort] ?? impact.effort} · risque : {impact.risk}
      </p>
      {status === 'ANSWERED' && (
        <p>
          <strong>Note : {score}/100</strong> — {feedback}
        </p>
      )}
    </article>
  );
}
