// Modal de synthèse de fin d'entretien
export default function SummaryModal({ summary, onClose }) {
  if (!summary) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Synthèse de votre entretien</h2>
        </div>
        <div className="modal-body">
          <p className="muted" style={{ marginBottom: '16px' }}>
            Vous avez posé {summary.questionsAsked} question{summary.questionsAsked > 1 ? 's' : ''}.
          </p>
          <h3>Ce que vous avez découvert</h3>
          <ul style={{ marginBottom: '16px' }}>
            {summary.discoveredPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
          <div className="alert alert-info">
            <strong>Retour</strong>
            {summary.qualityFeedback}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
