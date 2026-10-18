// Éditeur structuré du cahier des charges (maquette 05).
// - Brouillon : ajout, modification, suppression, réordonnancement, enregistrement, soumission (version 1).
// - Soumis ou évalué : lecture seule, sauf si l'étudiant arrive du module 3 avec une demande
//   acceptée ou négociée (?changeRequest=<id>) : il enregistre alors la version suivante.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import SessionPicker, { useSelectedSessionId } from '../../../shared/components/SessionPicker.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import EmptyState from '../../../shared/components/EmptyState.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import SessionStepper from '../components/SessionStepper.jsx';
import RequirementTabs from '../components/RequirementTabs.jsx';
import RequirementCard from '../components/RequirementCard.jsx';
import RequirementForm from '../components/RequirementForm.jsx';
import VersionHistory from '../components/VersionHistory.jsx';
import { useChangeRequestContext } from '../hooks/useChangeRequestContext.js';
import { STATUS_LABELS, modulePath, nextCode, toInput } from '../requirements.constants.js';
import { requirementsApi } from '../api.js';
import '../requirements.css';

export default function RequirementsEditorPage() {
  const { user } = useAuth();
  const isStudent = user.role === 'STUDENT';
  const sessionId = useSelectedSessionId();
  const [searchParams, setSearchParams] = useSearchParams();
  const changeRequestId = searchParams.get('changeRequest');

  const [document, setDocument] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [editingIndex, setEditingIndex] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(null); // 'save' | 'submit' | 'version'
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [versionsKey, setVersionsKey] = useState(0);

  const changeContext = useChangeRequestContext(isStudent ? sessionId : null, changeRequestId);

  const applyDocument = useCallback((loaded) => {
    setDocument(loaded);
    setRequirements(loaded.requirements.map(toInput));
    setEditingIndex(null);
    setDirty(false);
  }, []);

  const loadDocument = useCallback(() => {
    if (!sessionId) return;
    setDocument(null);
    setError(null);
    requirementsApi.getDocument(sessionId).then(applyDocument).catch(setError);
  }, [sessionId, applyDocument]);

  useEffect(() => {
    setNotice(null);
    loadDocument();
  }, [loadDocument]);

  // Prévient la perte des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const locked = document ? document.status !== 'DRAFT' : true;
  const versionMode =
    isStudent && locked && Boolean(changeRequestId) && changeContext.changeRequest && !changeContext.problem && !changeContext.usedInVersion;
  const canEdit = isStudent && document && (!locked || versionMode);

  const visible = useMemo(
    () =>
      requirements
        .map((requirement, index) => ({ requirement, index }))
        .filter(({ requirement }) => tab === 'ALL' || requirement.type === tab),
    [requirements, tab],
  );

  function change(updater) {
    setRequirements(updater);
    setDirty(true);
    setNotice(null);
  }

  function handleFormSubmit(values) {
    if (editingIndex === null) {
      change((current) => [...current, { ...values, code: nextCode(current, values.type) }]);
      return;
    }
    change((current) =>
      current.map((requirement, index) => {
        if (index !== editingIndex) return requirement;
        const others = current.filter((_, position) => position !== index);
        const code = values.type === requirement.type ? requirement.code : nextCode(others, values.type);
        return { ...values, code };
      }),
    );
    setEditingIndex(null);
  }

  function handleRemove(index) {
    if (!window.confirm(`Supprimer l'exigence ${requirements[index].code} ?`)) return;
    change((current) => current.filter((_, position) => position !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && index < editingIndex) setEditingIndex(editingIndex - 1);
  }

  function handleMove(index, offset) {
    const target = index + offset;
    if (target < 0 || target >= requirements.length) return;
    change((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    if (editingIndex === index) setEditingIndex(target);
    else if (editingIndex === target) setEditingIndex(index);
  }

  async function run(kind, action) {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  const handleSave = () =>
    run('save', async () => {
      applyDocument(await requirementsApi.saveDocument(sessionId, requirements));
      setNotice('Brouillon enregistré.');
    });

  const handleSubmit = () => {
    if (!window.confirm('Une fois soumis, le cahier des charges ne sera plus modifiable (sauf après une demande de changement). Soumettre ?')) return;
    run('submit', async () => {
      if (dirty) await requirementsApi.saveDocument(sessionId, requirements);
      applyDocument(await requirementsApi.submitDocument(sessionId));
      setVersionsKey((key) => key + 1);
      setNotice('Cahier des charges soumis (version 1). Vous pouvez maintenant lancer son évaluation.');
    });
  };

  const handleCreateVersion = (event) => {
    event.preventDefault();
    run('version', async () => {
      const version = await requirementsApi.createVersion(sessionId, { changeRequestId, reason, requirements });
      setReason('');
      setVersionsKey((key) => key + 1);
      applyDocument(await requirementsApi.getDocument(sessionId));
      // La demande est intégrée : l'éditeur repasse en lecture seule
      setSearchParams({ session: sessionId }, { replace: true });
      setNotice(`Version ${version.version} enregistrée suite à la demande « ${version.changeRequest?.title} ».`);
    });
  };

  const status = document ? STATUS_LABELS[document.status] : null;
  const actions =
    document && isStudent && !locked ? (
      <>
        <button type="button" className="btn btn-secondary" onClick={handleSave} disabled={!dirty || busy !== null}>
          {busy === 'save' ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={requirements.length === 0 || busy !== null}>
          {busy === 'submit' ? 'Soumission…' : "Soumettre à l'évaluation"}
        </button>
      </>
    ) : document && locked ? (
      <Link className={`btn${versionMode ? ' btn-secondary' : ''}`} to={modulePath('evaluation', sessionId)}>
        {document.status === 'SUBMITTED' && isStudent ? "Passer à l'évaluation" : "Voir l'évaluation"}
      </Link>
    ) : null;

  return (
    <section>
      <PageHeader
        eyebrow="Module 4"
        title="Cahier des charges"
        description="Traduisez ce que vous avez appris pendant l'entretien en exigences claires, testables et priorisées."
        actions={actions}
      />
      <SessionPicker />
      <SessionStepper current="Cahier des charges" />

      {changeRequestId && isStudent && (
        <ChangeRequestBanner context={changeContext} document={document} versionMode={versionMode} sessionId={sessionId} />
      )}
      {document && locked && !versionMode && (
        <div className="alert alert-info">
          {isStudent
            ? `Le cahier des charges est soumis (version ${document.currentVersion}) : il est en lecture seule. Il pourra évoluer après une demande de changement acceptée ou négociée.`
            : 'Consultation en lecture seule.'}
        </div>
      )}
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}
      <ErrorMessage error={error} onRetry={document ? undefined : loadDocument} />

      {sessionId && !document && !error && <Loader />}

      {document && (
        <>
          <div className="cluster requirements-toolbar">
            {status && <span className={`badge ${status.badge}`}>{status.label}</span>}
            {document.currentVersion && <span className="muted small">Version {document.currentVersion}</span>}
            {dirty && <span className="small requirements-unsaved">Modifications non enregistrées</span>}
          </div>
          <RequirementTabs requirements={requirements} active={tab} onChange={setTab} />

          <div className="two-columns">
            <div className="stack requirements-list">
              {visible.length === 0 && (
                <EmptyState
                  title={requirements.length === 0 ? 'Aucune exigence pour le moment' : 'Aucune exigence de ce type'}
                  description={
                    canEdit
                      ? 'Repartez des notes de votre entretien et ajoutez votre première exigence avec le formulaire.'
                      : 'L\'étudiant n\'a pas encore rédigé d\'exigence de ce type.'
                  }
                />
              )}
              {visible.map(({ requirement, index }) => (
                <RequirementCard
                  key={`${requirement.code}-${index}`}
                  requirement={requirement}
                  isEditing={editingIndex === index}
                  actions={
                    canEdit && (
                      <>
                        {tab === 'ALL' && (
                          <>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleMove(index, -1)} disabled={index === 0} aria-label={`Monter ${requirement.code}`}>
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleMove(index, 1)}
                              disabled={index === requirements.length - 1}
                              aria-label={`Descendre ${requirement.code}`}
                            >
                              ↓
                            </button>
                          </>
                        )}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingIndex(index)}>
                          Modifier
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRemove(index)}>
                          Supprimer
                        </button>
                      </>
                    )
                  }
                />
              ))}
            </div>

            <div className="stack requirements-side">
              {canEdit && (
                <RequirementForm
                  editing={editingIndex === null ? null : requirements[editingIndex]}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setEditingIndex(null)}
                />
              )}
              {versionMode && (
                <form className="card stack" onSubmit={handleCreateVersion}>
                  <h3>Enregistrer la version {(document.currentVersion ?? 0) + 1}</h3>
                  <label>
                    Ce qui change
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={3}
                      required
                      minLength={5}
                      maxLength={500}
                      placeholder="ex. Ajout de EF-04 pour le paiement en ligne, priorité de US-02 abaissée"
                    />
                  </label>
                  <button type="submit" className="btn" disabled={busy !== null || requirements.length === 0}>
                    {busy === 'version' ? 'Enregistrement…' : `Enregistrer la version ${(document.currentVersion ?? 0) + 1}`}
                  </button>
                </form>
              )}
              {document.currentVersion && <VersionHistory sessionId={sessionId} refreshKey={versionsKey} />}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ChangeRequestBanner({ context, document, versionMode, sessionId }) {
  if (context.loading) return <Loader label="Vérification de la demande de changement…" />;
  if (context.error) return <ErrorMessage error={context.error} />;
  if (context.problem) return <div className="alert alert-warning">{context.problem}</div>;
  if (!context.changeRequest) return null;

  const title = `« ${context.changeRequest.title} »`;
  if (context.usedInVersion) {
    return (
      <div className="alert alert-info">
        La demande {title} a déjà été intégrée dans la version {context.usedInVersion}.
      </div>
    );
  }
  if (document?.status === 'DRAFT') {
    return (
      <div className="alert alert-info">
        Demande de changement {title} : votre cahier des charges est encore un brouillon, intégrez-la directement puis soumettez-le.
      </div>
    );
  }
  if (!versionMode) return null;
  return (
    <div className="alert alert-warning requirements-change-banner">
      <strong>Modification suite à la demande {title}.</strong> Faites évoluer vos exigences, décrivez ce qui change, puis enregistrez la
      nouvelle version. Elle pourra ensuite être réévaluée.{' '}
      <Link to={`/change-requests?session=${encodeURIComponent(sessionId)}`}>Revenir aux demandes de changement</Link>
    </div>
  );
}
