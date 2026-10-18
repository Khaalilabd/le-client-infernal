// Formulaire d'ajout ou de modification d'une exigence (maquette 05), avec aide à la rédaction.
import { useEffect, useState } from 'react';
import { PRIORITIES, TYPE_LABELS, USER_STORY_FORMAT, USER_STORY_TEMPLATE } from '../requirements.constants.js';

const EMPTY = { type: 'FUNCTIONAL', title: '', description: '', priority: 'SHOULD', criteriaText: '' };

const PLACEHOLDERS = {
  FUNCTIONAL: 'Le système doit permettre de…',
  NON_FUNCTIONAL: 'Le système doit… (avec un seuil mesurable : délai, volume, disponibilité…)',
  USER_STORY: 'En tant que…, je veux… afin de…',
};

const HINTS = {
  FUNCTIONAL: 'Une exigence = une seule fonctionnalité, vérifiable par un test.',
  NON_FUNCTIONAL: 'Chiffrez : « en moins de 2 s » plutôt que « rapide ».',
  USER_STORY: 'Qui ? Quoi ? Pourquoi ? Ajoutez des critères d\'acceptation.',
};

function toForm(requirement) {
  if (!requirement) return EMPTY;
  return { ...requirement, criteriaText: (requirement.acceptanceCriteria ?? []).join('\n') };
}

export default function RequirementForm({ editing, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(editing));

  useEffect(() => {
    setForm(toForm(editing));
  }, [editing]);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const isStory = form.type === 'USER_STORY';
  const storyFormatOk = !isStory || form.description.trim() === '' || USER_STORY_FORMAT.test(form.description);

  function handleSubmit(event) {
    event.preventDefault();
    const acceptanceCriteria = form.criteriaText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    onSubmit({
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      ...(acceptanceCriteria.length ? { acceptanceCriteria } : {}),
    });
    if (!editing) setForm({ ...EMPTY, type: form.type, priority: form.priority });
  }

  return (
    <form className="card stack requirements-form" onSubmit={handleSubmit}>
      <h3>{editing ? `Modifier ${editing.code}` : 'Nouvelle exigence'}</h3>
      <div className="row">
        <label>
          Type
          <select value={form.type} onChange={update('type')}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priorité
          <select value={form.priority} onChange={update('priority')}>
            {PRIORITIES.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Titre
        <input value={form.title} onChange={update('title')} required minLength={3} maxLength={150} placeholder="ex. Paiement en ligne" />
      </label>
      <label>
        Description
        <textarea
          value={form.description}
          onChange={update('description')}
          required
          minLength={5}
          maxLength={3000}
          rows={3}
          placeholder={PLACEHOLDERS[form.type]}
          aria-describedby="requirements-description-hint"
        />
        <span id="requirements-description-hint" className="field-hint">
          {HINTS[form.type]}
        </span>
        {isStory && (
          <span className="cluster">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setForm({ ...form, description: USER_STORY_TEMPLATE })}
            >
              Insérer le modèle
            </button>
            {!storyFormatOk && (
              <span className="field-error" role="alert">
                Format attendu : « En tant que… je veux… afin de… »
              </span>
            )}
          </span>
        )}
      </label>
      {isStory && (
        <label>
          Critères d'acceptation
          <textarea value={form.criteriaText} onChange={update('criteriaText')} rows={3} placeholder="Un critère par ligne" />
          <span className="field-hint">Rendez l'exigence testable.</span>
        </label>
      )}
      <div className="cluster">
        <button type="submit" className="btn btn-secondary">
          {editing ? 'Valider la modification' : 'Ajouter'}
        </button>
        {editing && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
