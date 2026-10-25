// Tableau de l'historique des séances de l'étudiant
export function HistoryTable({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune séance enregistrée</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      IN_PROGRESS: { label: 'En cours', className: 'badge-warning' },
      COMPLETED: { label: 'Terminée', className: 'badge-success' },
      ABANDONED: { label: 'Abandonnée', className: 'badge-danger' },
    };
    const badge = badges[status] || { label: status, className: '' };
    return <span className={`badge ${badge.className}`}>{badge.label}</span>;
  };

  const getLevelBadge = (level) => {
    const levels = {
      BEGINNER: { label: 'Débutant', className: 'badge-info' },
      INTERMEDIATE: { label: 'Intermédiaire', className: 'badge-primary' },
      ADVANCED: { label: 'Avancé', className: 'badge-danger' },
    };
    const badge = levels[level] || { label: level, className: '' };
    return <span className={`badge ${badge.className}`}>{badge.label}</span>;
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Scénario</th>
            <th>Domaine</th>
            <th>Niveau</th>
            <th>Statut</th>
            <th>Dates</th>
            <th>Notes</th>
            <th>Feedback enseignant</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>
                <strong>{session.scenario.title}</strong>
              </td>
              <td>{session.scenario.domain}</td>
              <td>{getLevelBadge(session.scenario.level)}</td>
              <td>{getStatusBadge(session.status)}</td>
              <td>
                <div className="text-small">
                  <div>Début : {formatDate(session.startedAt)}</div>
                  {session.completedAt && (
                    <div>Fin : {formatDate(session.completedAt)}</div>
                  )}
                </div>
              </td>
              <td>
                <div className="text-small">
                  {session.scores.interview > 0 && (
                    <div>🎤 Entretien : {session.scores.interview} questions</div>
                  )}
                  {session.scores.changeRequests !== null && (
                    <div>🔄 Changements : {session.scores.changeRequests}/100</div>
                  )}
                  {session.scores.requirements !== null && (
                    <div>📋 Exigences : {session.scores.requirements}/100</div>
                  )}
                  {session.finalScore !== null && (
                    <div>
                      <strong>Note finale : {session.finalScore}/100</strong>
                    </div>
                  )}
                </div>
              </td>
              <td>
                {session.feedback ? (
                  <div className="text-small">
                    {session.feedback.grade && (
                      <div>
                        <strong>Note : {session.feedback.grade}/20</strong>
                      </div>
                    )}
                    <div className="text-muted">
                      {session.feedback.teacher.firstName}{' '}
                      {session.feedback.teacher.lastName}
                    </div>
                    <div>{session.feedback.comment}</div>
                  </div>
                ) : (
                  <span className="text-muted">Pas encore</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
