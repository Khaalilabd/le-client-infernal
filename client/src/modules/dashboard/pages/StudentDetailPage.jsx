// Fiche d'un étudiant (espace enseignant, maquette 09) : séances, notes de chaque étape et accès au bilan.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import EmptyState from '../../../shared/components/EmptyState.jsx';
import { LEVEL_LABELS, STATUS_BADGES, STEP_LABELS, formatDate, formatScore } from '../format.js';
import { dashboardApi } from '../api.js';
import '../dashboard.css';

const initials = (student) => `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi.getStudentDetails(studentId).then(setData).catch(setError);
  }, [studentId]);

  if (error) return <ErrorMessage error={error} />;
  if (!data) return <Loader />;
  const { student, sessions, averageFinalScore } = data;

  return (
    <section>
      <PageHeader
        eyebrow="Espace enseignant"
        title={`${student.firstName} ${student.lastName}`}
        description={`${student.email} · inscrit le ${formatDate(student.createdAt)}`}
        actions={
          <Link to="/dashboard" className="btn btn-ghost">
            Retour à la vue d'ensemble
          </Link>
        }
      />

      <div className="card db-student-head">
        <div className="avatar avatar-lg">{initials(student)}</div>
        <div className="cluster">
          <span className="chip">{sessions.length} séance(s)</span>
          <span className="chip">{sessions.filter((session) => session.status === 'COMPLETED').length} terminée(s)</span>
          <span className="chip">Note moyenne : {formatScore(averageFinalScore)}</span>
        </div>
      </div>

      <div className="db-columns">
        {sessions.length === 0 ? (
          <EmptyState title="Aucune séance" description="Cet étudiant n'a pas encore commencé d'entraînement." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Scénario</th>
                <th>Statut</th>
                {Object.values(STEP_LABELS).map((label) => (
                  <th key={label}>{label}</th>
                ))}
                <th>Note finale</th>
                <th>Retours</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const badge = STATUS_BADGES[session.status] ?? { label: session.status, className: '' };
                return (
                  <tr key={session.id}>
                    <td>
                      <strong>{session.scenario.title}</strong>
                      <div className="muted small">
                        {LEVEL_LABELS[session.scenario.level]} · {formatDate(session.startedAt)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                    </td>
                    {Object.keys(STEP_LABELS).map((key) => (
                      <td key={key}>{formatScore(session.breakdown.components[key])}</td>
                    ))}
                    <td>
                      <strong>{formatScore(session.finalScore)}</strong>
                    </td>
                    <td>{session.feedbacks.length}</td>
                    <td className="db-table-actions">
                      <Link to={`/dashboard/sessions/${session.id}`} className="btn btn-ghost btn-sm">
                        Ouvrir et commenter
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
