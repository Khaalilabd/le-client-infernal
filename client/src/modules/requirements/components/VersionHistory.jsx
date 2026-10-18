// Historique des versions du cahier des charges, avec consultation du contenu figé de chaque version.
import { useEffect, useState } from 'react';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import RequirementCard from './RequirementCard.jsx';
import { requirementsApi } from '../api.js';

const DECISION_LABELS = { ACCEPT: 'acceptée', NEGOTIATE: 'négociée' };

export default function VersionHistory({ sessionId, refreshKey }) {
  const [versions, setVersions] = useState(null);
  const [opened, setOpened] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setVersions(null);
    setOpened(null);
    requirementsApi.listVersions(sessionId).then(setVersions).catch(setError);
  }, [sessionId, refreshKey]);

  async function open(versionNumber) {
    if (opened?.version === versionNumber) return setOpened(null);
    setError(null);
    try {
      setOpened(await requirementsApi.getVersion(sessionId, versionNumber));
    } catch (err) {
      setError(err);
    }
  }

  if (error) return <ErrorMessage error={error} />;
  if (versions === null) return <Loader label="Chargement des versions…" />;
  if (versions.length === 0) return null;

  return (
    <div className="card requirements-versions">
      <h3>Versions</h3>
      <ul className="timeline">
        {versions.map((version) => (
          <li key={version.id}>
            <div>
              <div className="cluster">
                <strong>Version {version.version}</strong>
                {version.globalScore !== null && <span className="badge badge-success">{version.globalScore} / 100</span>}
              </div>
              <p className="muted small requirements-version-meta">
                {new Date(version.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
                {version.requirementsCount} exigence(s)
              </p>
              <p className="small requirements-version-reason">
                {version.changeRequest
                  ? `Demande ${DECISION_LABELS[version.changeRequest.decision] ?? ''} : « ${version.changeRequest.title} ». `
                  : ''}
                {version.reason}
              </p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => open(version.version)} aria-expanded={opened?.version === version.version}>
                {opened?.version === version.version ? 'Masquer' : 'Voir le contenu'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {opened && (
        <div className="stack requirements-version-content">
          <h4>Contenu de la version {opened.version}</h4>
          {opened.snapshot.map((requirement) => (
            <RequirementCard key={requirement.code} requirement={requirement} />
          ))}
        </div>
      )}
    </div>
  );
}
