// Bilan d'une séance : notes de chaque étape, note finale, fin de séance et commentaires de l'enseignant.
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import { sessionsApi } from '../../../shared/api/sessions.js';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import { ScoreBreakdown } from '../components/ScoreBreakdown.jsx';
import { FeedbackForm, FeedbackList } from '../components/Feedbacks.jsx';
import { LEVEL_LABELS, STATUS_BADGES, formatDate } from '../format.js';
import { dashboardApi } from '../api.js';
import '../dashboard.css';

export default function SessionReportPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    dashboardApi.getSessionReport(sessionId).then(setReport).catch(setError);
  }, [sessionId]);

  useEffect(load, [load]);

  async function completeSession() {
    if (!window.confirm('Terminer la séance ? Votre note finale sera calculée et vous ne pourrez plus modifier cette séance.')) return;
    setCompleting(true);
    setActionError(null);
    try {
      await sessionsApi.updateStatus(sessionId, 'COMPLETED');
      load();
    } catch (err) {
      setActionError(err);
    } finally {
      setCompleting(false);
    }
  }

  if (error) return <ErrorMessage error={error} onRetry={load} />;
  if (!report) return <Loader />;

  const { session, breakdown } = report;
  const completed = session.status === 'COMPLETED';
  const canComplete = user.role === 'STUDENT' && session.status === 'IN_PROGRESS';
  const badge = STATUS_BADGES[session.status] ?? { label: session.status, className: '' };

  return (
    <section>
      <PageHeader
        eyebrow="Bilan de la séance"
        title={session.scenario.title}
        description={`${LEVEL_LABELS[session.scenario.level]} · ${session.scenario.domain} · démarrée le ${formatDate(session.startedAt)}${
          session.completedAt ? ` · ${completed ? 'terminée' : 'abandonnée'} le ${formatDate(session.completedAt)}` : ''
        }`}
        actions={<span className={`badge ${badge.className}`}>{badge.label}</span>}
      />

      <div className="card">
        <h3 className="db-card-title">Notes de la séance</h3>
        <ScoreBreakdown breakdown={breakdown} finalScore={session.finalScore} completed={completed} />
        <p className="muted small" style={{ marginBottom: 0 }}>
          Entretien : moyenne de vos 3 meilleures questions ({breakdown.details.questionsCount} posée(s)) · cahier des charges : dernière
          évaluation{breakdown.details.evaluatedVersion ? ` (version ${breakdown.details.evaluatedVersion})` : ''} · changements :{' '}
          {breakdown.details.answeredChangeRequests} demande(s) traitée(s). Les pondérations portent sur les étapes déjà notées.
        </p>
      </div>

      {canComplete && (
        <div className="card" style={{ marginTop: 'var(--space-4)' }}>
          <h3 className="db-card-title">Terminer la séance</h3>
          <p className="small">
            Quand vous avez terminé l'entretien, fait évaluer votre cahier des charges et répondu aux demandes de changement, terminez la
            séance pour obtenir votre note finale. Elle alimentera votre progression et la recommandation du prochain scénario.
          </p>
          <ErrorMessage error={actionError} />
          {actionError?.code === 'REQUIREMENTS_NOT_EVALUATED' && (
            <p className="small">
              <Link to={`/requirements?session=${session.id}`}>Aller au cahier des charges</Link>
            </p>
          )}
          <button type="button" className="btn" onClick={completeSession} disabled={completing}>
            {completing ? 'Calcul de la note…' : 'Terminer la séance'}
          </button>
        </div>
      )}

      <div className={user.role === 'TEACHER' ? 'split db-columns' : 'db-columns'}>
        <div className="card">
          <h3 className="db-card-title">Commentaires de l'enseignant</h3>
          <FeedbackList feedbacks={session.feedbacks} />
        </div>
        {user.role === 'TEACHER' && (
          <aside className="card">
            <h3 className="db-card-title">Ajouter un retour</h3>
            <FeedbackForm sessionId={session.id} onAdded={load} />
          </aside>
        )}
      </div>
    </section>
  );
}
