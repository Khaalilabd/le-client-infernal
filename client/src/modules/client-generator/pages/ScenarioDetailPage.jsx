// Détail public d'un scénario : fiche du client, contexte et demande initiale.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import { LEVEL_LABELS } from '../components/ScenarioCard.jsx';
import { useClientGeneratorOptions, profileLabel } from '../hooks/useClientGeneratorOptions.js';
import { useScenarioActions } from '../hooks/useScenarioActions.js';
import { clientGeneratorApi } from '../api.js';
import '../client-generator.css';

function initials(name) {
  return name
    .replace(/^(M\.|Mme|Dr|Pr)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function ScenarioDetailPage() {
  const { scenarioId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { options } = useClientGeneratorOptions();
  const [scenario, setScenario] = useState(null);
  const [error, setError] = useState(null);
  const { startSession, deleteScenario, actionError } = useScenarioActions({
    onDeleted: () => navigate('/client-generator'),
  });

  const load = useCallback(() => {
    setError(null);
    clientGeneratorApi.getScenario(scenarioId).then(setScenario).catch(setError);
  }, [scenarioId]);

  useEffect(load, [load]);

  const back = (
    <Link to="/client-generator" className="btn btn-ghost">
      Retour aux scénarios
    </Link>
  );

  if (error) {
    return (
      <section>
        <PageHeader eyebrow="Module 1" title="Scénario" actions={back} />
        <ErrorMessage error={error} onRetry={load} />
      </section>
    );
  }
  if (!scenario) return <Loader label="Chargement du scénario…" />;

  const personality = scenario.personality ?? {};
  const label = profileLabel(options, personality.profile);

  return (
    <section>
      <PageHeader
        eyebrow={`Module 1 · ${scenario.domain}`}
        title={scenario.title}
        actions={
          <>
            {back}
            {user.role === 'TEACHER' && (
              <button type="button" className="btn btn-secondary" onClick={() => deleteScenario(scenario)}>
                Supprimer
              </button>
            )}
            {user.role === 'STUDENT' && (
              <button type="button" className="btn" onClick={() => startSession(scenario)}>
                Démarrer une séance
              </button>
            )}
          </>
        }
      />
      <ErrorMessage error={actionError} />

      <div className="two-columns">
        <div className="stack" style={{ marginTop: 0 }}>
          <div className="card">
            <h3>Contexte</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>{scenario.context}</p>
            <h3 style={{ marginTop: 'var(--space-4)' }}>Ce que le client demande</h3>
            <p className="cg-detail-need">« {scenario.expressedNeed} »</p>
          </div>
          <div className="alert alert-info">
            Le besoin réel du client et ses contraintes implicites ne sont pas affichés : c'est à vous de les découvrir
            pendant l'entretien.
          </div>
        </div>

        <aside className="card client-card">
          <div className="client-card-head">
            <div className="avatar avatar-lg">{initials(scenario.clientName)}</div>
            <div>
              <h3>{scenario.clientName}</h3>
              <span className="muted small">
                {scenario.clientRole} — {scenario.companyName}
              </span>
            </div>
          </div>
          <div className="cluster">
            <span className={`badge level-${scenario.level.toLowerCase()}`}>{LEVEL_LABELS[scenario.level]}</span>
            {label && <span className="badge badge-info">Client {label.toLowerCase()}</span>}
          </div>
          {personality.traits?.length > 0 && (
            <div className="cluster">
              {personality.traits.map((trait) => (
                <span key={trait} className="chip">
                  {trait}
                </span>
              ))}
            </div>
          )}
          <dl>
            {personality.communicationStyle && (
              <>
                <dt>Style de communication</dt>
                <dd>{personality.communicationStyle}</dd>
              </>
            )}
            {personality.mood && (
              <>
                <dt>Humeur</dt>
                <dd>{personality.mood}</dd>
              </>
            )}
            <dt>Créé le</dt>
            <dd>{new Date(scenario.createdAt).toLocaleDateString('fr-FR')}</dd>
          </dl>
        </aside>
      </div>
    </section>
  );
}
