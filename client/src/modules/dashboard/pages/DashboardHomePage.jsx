// Tableau de bord : espace étudiant (maquette 08) ou espace enseignant (maquette 09).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import { HistoryTimeline } from '../components/HistoryTimeline.jsx';
import { RecommendationCard } from '../components/RecommendationCard.jsx';
import { ProgressChart } from '../components/ProgressChart.jsx';
import { SkillsCard } from '../components/SkillsCard.jsx';
import { STATUS_BADGES, formatDate, formatScore } from '../format.js';
import { dashboardApi } from '../api.js';
import '../dashboard.css';

/** La recommandation (appel au LLM) se charge à part : une erreur de l'IA ne masque pas le reste. */
function RecommendationPanel() {
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    setRecommendation(null);
    dashboardApi.getMyRecommendation().then(setRecommendation).catch(setError);
  }, []);

  useEffect(load, [load]);

  if (error) return <ErrorMessage error={error} onRetry={load} />;
  if (!recommendation) return <div className="card"><Loader label="Analyse de votre historique par l'IA…" /></div>;
  return <RecommendationCard recommendation={recommendation} />;
}

function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([dashboardApi.getMyStats(), dashboardApi.getMyHistory()])
      .then(([stats, history]) => setData({ stats, history }))
      .catch(setError);
  }, []);

  if (error) return <ErrorMessage error={error} />;
  if (!data) return <Loader />;
  const { stats, history } = data;

  return (
    <>
      <div className="grid stats-grid">
        <StatCard label="Séances" value={stats.sessions.total} hint={`${stats.sessions.completed} terminée(s)`} />
        <StatCard label="Note finale moyenne" value={stats.averageFinalScore === null ? null : formatScore(stats.averageFinalScore)} />
        <StatCard label="Questions posées" value={stats.interviewMessages} />
        <StatCard label="Changements gérés" value={stats.changeRequests.total} hint={`Moyenne : ${formatScore(stats.changeRequests.averageScore)}`} />
        <StatCard label="Cahiers évalués" value={stats.requirements.evaluations} hint={`Moyenne : ${formatScore(stats.requirements.averageScore)}`} />
      </div>

      <div className="two-columns db-columns">
        <div className="stack" style={{ marginTop: 0 }}>
          <div className="card">
            <h3 className="db-card-title">Historique des séances</h3>
            <HistoryTimeline sessions={history} />
          </div>
          <div className="card">
            <h3 className="db-card-title">Progression</h3>
            <ProgressChart points={stats.progression} />
          </div>
        </div>
        <div className="stack" style={{ marginTop: 0 }}>
          <RecommendationPanel />
          <SkillsCard skills={stats.skills} />
        </div>
      </div>
    </>
  );
}

function TeacherDashboard() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi.getTeacherOverview().then(setOverview).catch(setError);
  }, []);

  if (error) return <ErrorMessage error={error} />;
  if (!overview) return <Loader />;

  return (
    <>
      <div className="grid stats-grid">
        <StatCard label="Étudiants" value={overview.counts.students} />
        <StatCard label="Séances" value={overview.counts.sessions} />
        <StatCard label="Note moyenne" value={overview.averageFinalScore === null ? null : formatScore(overview.averageFinalScore)} />
        <StatCard label="Appels IA réussis" value={overview.aiCalls.SUCCESS ?? 0} hint={`Erreurs : ${overview.aiCalls.ERROR ?? 0}`} />
      </div>

      <div className="split db-columns">
        <div>
          <h3 className="db-card-title">Séances récentes</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Scénario</th>
                <th>Statut</th>
                <th>Note</th>
                <th>Début</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {overview.recentSessions.map((session) => {
                const badge = STATUS_BADGES[session.status] ?? { label: session.status, className: '' };
                return (
                  <tr key={session.id}>
                    <td>
                      <Link to={`/dashboard/students/${session.student.id}`}>
                        <strong>
                          {session.student.firstName} {session.student.lastName}
                        </strong>
                      </Link>
                    </td>
                    <td>{session.scenario.title}</td>
                    <td>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td>{formatScore(session.finalScore)}</td>
                    <td>{formatDate(session.startedAt)}</td>
                    <td className="db-table-actions">
                      <Link to={`/dashboard/sessions/${session.id}`} className="btn btn-ghost btn-sm">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <aside className="card">
          <h3 className="db-card-title">Étudiants</h3>
          <ul className="timeline">
            {overview.students.map((student) => (
              <li key={student.id}>
                <div>
                  <Link to={`/dashboard/students/${student.id}`} className="db-timeline-link">
                    {student.firstName} {student.lastName}
                  </Link>
                  <span className="muted small db-timeline-meta">
                    {student.sessions} séance(s) · {student.completed} terminée(s) · moyenne {formatScore(student.averageFinalScore)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const isTeacher = user.role === 'TEACHER';
  return (
    <section>
      <PageHeader
        eyebrow="Module 5"
        title={isTeacher ? 'Espace enseignant' : 'Mon tableau de bord'}
        description={
          isTeacher
            ? 'Vue d\'ensemble de la promotion, suivi individuel et commentaires.'
            : 'Suivez vos progrès et laissez-vous guider vers le prochain scénario.'
        }
      />
      {isTeacher ? <TeacherDashboard /> : <StudentDashboard />}
    </section>
  );
}
