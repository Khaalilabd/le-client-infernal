// Formulaire d'ajout d'une exigence.
import { useState } from 'react';

export const TYPE_LABELS = {
  FUNCTIONAL: 'Fonctionnelle',
  NON_FUNCTIONAL: 'Non fonctionnelle',
  USER_STORY: 'User story',
};
const CODE_PREFIXES = { FUNCTIONAL: 'EF', NON_FUNCTIONAL: 'ENF', USER_STORY: 'US' };
const PRIORITIES = ['MUST', 'SHOULD', 'COULD', 'WONT'];

const EMPTY = { type: 'FUNCTIONAL', title: '', description: '', priority: 'SHOULD' };

export default function RequirementForm({ existing, onAdd }) {
  const [form, setForm] = useState(EMPTY);

  function handleSubmit(event) {
    event.preventDefault();
    const sameType = existing.filter((requirement) => requirement.type === form.type).length;
    const code = `${CODE_PREFIXES[form.type]}-${String(sameType + 1).padStart(2, '0')}`;
    onAdd({ ...form, code });
    setForm({ ...EMPTY, type: form.type });
  }

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <h3>Nouvelle exigence</h3>
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
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Titre
        <input value={form.title} onChange={update('title')} required minLength={3} />
      </label>
      <label>
        Description
        <textarea
          value={form.description}
          onChange={update('description')}
          required
          minLength={5}
          rows={3}
          placeholder={form.type === 'USER_STORY' ? 'En tant que…, je veux… afin de…' : 'Le système doit…'}
        />
      </label>
      <button type="submit" className="btn btn-secondary">
        Ajouter
      </button>
    </form>
  );
}
