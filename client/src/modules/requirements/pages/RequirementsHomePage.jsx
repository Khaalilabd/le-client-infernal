import { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import SessionPicker, { useSelectedSessionId } from '../../../shared/components/SessionPicker.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import RequirementForm, { TYPE_LABELS } from '../components/RequirementForm.jsx';
import { requirementsApi } from '../api.js';

function toInput({ type, code, title, description, priority, acceptanceCriteria }) {
  return { type, code, title, description, priority, ...(acceptanceCriteria ? { acceptanceCriteria } : {}) };
}

export default function RequirementsHomePage() {
  const { user } = useAuth();
  const sessionId = useSelectedSessionId();
  const [requirements, setRequirements] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const canEdit = user.role === 'STUDENT';

  useEffect(() => {
    if (!sessionId) return;
    setRequirements(null);
    setError(null);
    requirementsApi
      .getDocument(sessionId)
      .then((document) => {
        setRequirements(document.requirements.map(toInput));
        setDirty(false);
      })
      .catch(setError);
  }, [sessionId]);

  function handleAdd(requirement) {
    setRequirements((current) => [...current, requirement]);
    setDirty(true);
  }

  function handleRemove(index) {
    setRequirements((current) => current.filter((_, position) => position !== index));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const document = await requirementsApi.saveDocument(sessionId, requirements);
      setRequirements(document.requirements.map(toInput));
      setDirty(false);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h1>Cahier des charges</h1>
      <p className="muted">Traduisez ce que vous avez appris pendant l'entretien en exigences claires et testables.</p>
      <SessionPicker />
      <ErrorMessage error={error} />

      {sessionId &&
        (requirements === null ? (
          !error && <Loader />
        ) : (
          <div className="two-columns">
            <div className="stack">
              {requirements.length === 0 && <p className="muted">Aucune exigence pour le moment.</p>}
              {requirements.map((requirement, index) => (
                <article key={`${requirement.code}-${index}`} className="card">
                  <div className="card-header">
                    <h3>
                      {requirement.code} — {requirement.title}
                    </h3>
                    <span className="badge">{requirement.priority}</span>
                  </div>
                  <p className="muted">{TYPE_LABELS[requirement.type]}</p>
                  <p>{requirement.description}</p>
                  {canEdit && (
                    <button type="button" className="btn btn-ghost" onClick={() => handleRemove(index)}>
                      Supprimer
                    </button>
                  )}
                </article>
              ))}
              {canEdit && (
                <button type="button" className="btn" onClick={handleSave} disabled={!dirty || saving}>
                  {saving ? 'Enregistrement…' : dirty ? 'Enregistrer le cahier des charges' : 'Enregistré'}
                </button>
              )}
            </div>
            {canEdit && <RequirementForm existing={requirements} onAdd={handleAdd} />}
          </div>
        ))}
    </section>
  );
}
