// Évaluation du cahier des charges par l'IA (maquette 06) : note globale, détail par critère,
// correspondance avec le besoin réel (matching), pistes d'amélioration et historique des évaluations par version. Le besoin caché n'est jamais affiché.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import SessionPicker, { useSelectedSessionId } from '../../../shared/components/SessionPicker.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import EmptyState from '../../../shared/components/EmptyState.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import SessionStepper from '../components/SessionStepper.jsx';
import CriterionBar from '../components/CriterionBar.jsx';
import MatchingPanel from '../components/MatchingPanel.jsx';
import { formatCount, modulePath } from '../requirements.constants.js';
import { requirementsApi } from '../api.js';
import '../requirements.css';

export default function RequirementsEvaluationPage() {
  const { user } = useAuth();
  const isStudent = user.role === 'STUDENT';
  const sessionId = useSelectedSessionId();
  const [document, setDocument] = useState(null);
  const [evaluations, setEvaluations] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateError, setEvaluateError] = useState(null);

  const load = useCallback(() => {
    if (!sessionId) return;
    setDocument(null);
    setEvaluations(null);
    setLoadError(null);
    setEvaluateError(null);
    Promise.all([requirementsApi.getDocument(sessionId), requirementsApi.listEvaluations(sessionId)])
      .then(([loadedDocument, loadedEvaluations]) => {
        setDocument(loadedDocument);
        setEvaluations(loadedEvaluations);
        setSelectedId(loadedEvaluations[0]?.id ?? null);
      })
      .catch(setLoadError);
  }, [sessionId]);

  useEffect(load, [load]);

  async function handleEvaluate() {
    setEvaluating(true);
    setEvaluateError(null);
    try {
      const evaluation = await requirementsApi.evaluateDocument(sessionId);
      setEvaluations((current) => [evaluation, ...current]);
      setSelectedId(evaluation.id);
      setDocument((current) => ({ ...current, status: 'EVALUATED' }));
    } catch (err) {
      setEvaluateError(err);
    } finally {
      setEvaluating(false);
    }
  }

  const selected = evaluations?.find((evaluation) => evaluation.id === selectedId) ?? null;
  const canEvaluate = isStudent && document?.status === 'SUBMITTED';

  return (
    <section>
      <PageHeader
        eyebrow="Module 4 · Évaluation"
        title="Évaluation du cahier des charges"
        description="Le cahier des charges est comparé au véritable besoin du client selon la grille ci-dessous."
        actions={
          <>
            <Link className="btn btn-ghost" to={modulePath('', sessionId)}>
              Revenir à l'éditeur
            </Link>
            {/* Étape suivante du parcours : bilan et fin de séance (module 5) */}
            {sessionId && evaluations?.length > 0 && (
              <Link className="btn" to={`/dashboard/sessions/${sessionId}`}>
                Bilan de la séance
              </Link>
            )}
          </>
        }
      />
      <SessionPicker />
      <SessionStepper current="Évaluation" />
      <ErrorMessage error={loadError} onRetry={load} />
      {sessionId && !document && !loadError && <Loader />}

      {document && evaluations && (
        <>
          {canEvaluate && (
            <div className="card requirements-evaluate">
              <div>
                <h3>{evaluations.length === 0 ? 'Prêt pour l\'évaluation' : `Nouvelle version à évaluer`}</h3>
                <p className="muted">
                  {`La version ${document.currentVersion} de votre cahier des charges (${formatCount(document.requirements.length)}) sera comparée au véritable besoin du client.`}
                </p>
              </div>
              <button type="button" className="btn" onClick={handleEvaluate} disabled={evaluating}>
                {evaluating ? 'Évaluation en cours…' : `Évaluer la version ${document.currentVersion}`}
              </button>
            </div>
          )}
          {evaluating && <Loader label="L'IA évalue votre cahier des charges…" />}
          <ErrorMessage error={evaluateError} onRetry={handleEvaluate} />

          {evaluations.length === 0 && !canEvaluate && (
            <EmptyState
              title="Aucune évaluation pour le moment"
              description={
                document.status === 'DRAFT'
                  ? 'Le cahier des charges est encore un brouillon : soumettez-le depuis l\'éditeur pour pouvoir l\'évaluer.'
                  : 'L\'étudiant n\'a pas encore demandé d\'évaluation.'
              }
              action={
                isStudent && (
                  <Link className="btn" to={modulePath('', sessionId)}>
                    Ouvrir l'éditeur
                  </Link>
                )
              }
            />
          )}

          {selected && (
            <>
              {evaluations.length > 1 && (
                <label className="session-picker">
                  Évaluation :
                  <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                    {evaluations.map((evaluation) => (
                      <option key={evaluation.id} value={evaluation.id}>
                        Version {evaluation.version ?? '?'} — {evaluation.globalScore} / 100 —{' '}
                        {new Date(evaluation.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <EvaluationDetail evaluation={selected} />
            </>
          )}
        </>
      )}
    </section>
  );
}

function EvaluationDetail({ evaluation }) {
  return (
    <div className="two-columns">
      <div className="stack requirements-side">
        <div className="card">
          <h3 className="requirements-section-title">Détail par critère</h3>
          <div className="criteria">
            {evaluation.criteria.map((criterion) => (
              <CriterionBar key={criterion.name} criterion={criterion} />
            ))}
          </div>
        </div>
        <MatchingPanel criteria={evaluation.criteria} />
      </div>
      <div className="stack requirements-side">
        <div className="card">
          <span className="eyebrow">Note globale{evaluation.version ? ` · version ${evaluation.version}` : ''}</span>
          <div className="score">
            <span className="score-value">{evaluation.globalScore}</span>
            <span className="score-max">/ 100</span>
          </div>
          <p className="muted requirements-feedback">{evaluation.feedback}</p>
        </div>
        <div className="card">
          <h4>Pistes d'amélioration</h4>
          <ul className="small requirements-points">
            {evaluation.missingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="alert alert-info requirements-hidden-note">
          Le besoin caché n'est jamais affiché : les pistes vous orientent sans le révéler.
        </div>
      </div>
    </div>
  );
}
