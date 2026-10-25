// Historique des séances de l'étudiant (chronologie de la maquette 08), avec lien vers le bilan.
import { Link } from 'react-router-dom';
import EmptyState from '../../../shared/components/EmptyState.jsx';
import { LEVEL_LABELS, STATUS_BADGES, formatDate, formatScore } from '../format.js';

function sessionBadge(session) {
  if (session.status === 'COMPLETED' && typeof session.finalScore === 'number') {
    return <span className="badge badge-success">{formatScore(session.finalScore)} / 100</span>;
  }
  const badge = STATUS_BADGES[session.status] ?? { label: session.status, className: '' };
  return <span className={`badge ${badge.className}`}>{badge.label}</span>;
}

function sessionMeta(session) {
  const parts = [LEVEL_LABELS[session.scenario.level] ?? session.scenario.level, session.scenario.domain];
  parts.push(session.completedAt ? `terminée le ${formatDate(session.completedAt)}` : `démarrée le ${formatDate(session.startedAt)}`);
  if (session.feedbacks.length > 0) parts.push('commentaire de l\'enseignant');
  return parts.join(' · ');
}

export function HistoryTimeline({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState
        title="Aucune séance pour le moment"
        description="Générez un client dans le module 1, puis démarrez une séance pour commencer votre entraînement."
      />
    );
  }

  return (
    <ul className="timeline">
      {sessions.map((session) => (
        <li key={session.id}>
          <div>
            <Link to={`/dashboard/sessions/${session.id}`} className="db-timeline-link">
              {session.scenario.title}
            </Link>{' '}
            {sessionBadge(session)}
            <span className="muted small db-timeline-meta">{sessionMeta(session)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
