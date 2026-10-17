import { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import { dashboardApi } from '../api.js';

function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi.getMyStats().then(setStats).catch(setError);
  }, []);

  if (error) return <ErrorMessage error={error} />;
  if (!stats) return <Loader />;

  return (
    <div className="grid stats-grid">
      <StatCard label="Séances" value={stats.sessions.total} hint={`${stats.sessions.completed} terminée(s)`} />
      <StatCard label="Note finale moyenne" value={stats.averageFinalScore} />
      <StatCard label="Questions posées au client" value={stats.interviewMessages} />
      <StatCard label="Demandes de changement" value={stats.changeRequests.total} hint={`Moyenne : ${stats.changeRequests.averageScore ?? '—'}`} />
      <StatCard label="Cahiers des charges évalués" value={stats.requirements.evaluations} hint={`Moyenne : ${stats.requirements.averageScore ?? '—'}`} />
    </div>
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
        <StatCard label="Scénarios" value={overview.counts.scenarios} />
        <StatCard label="Appels IA réussis" value={overview.aiCalls.SUCCESS ?? 0} hint={`Erreurs : ${overview.aiCalls.ERROR ?? 0}`} />
      </div>
      <h2>Séances récentes</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Étudiant</th>
            <th>Scénario</th>
            <th>Statut</th>
            <th>Note</th>
            <th>Début</th>
          </tr>
        </thead>
        <tbody>
          {overview.recentSessions.map((session) => (
            <tr key={session.id}>
              <td>
                {session.student.firstName} {session.student.lastName}
              </td>
              <td>{session.scenario.title}</td>
              <td>{session.status}</td>
              <td>{session.finalScore ?? '—'}</td>
              <td>{new Date(session.startedAt).toLocaleDateString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  return (
    <section>
      <h1>{user.role === 'TEACHER' ? 'Espace enseignant' : 'Mon tableau de bord'}</h1>
      {user.role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />}
    </section>
  );
}
