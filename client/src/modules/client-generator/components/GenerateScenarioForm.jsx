// Formulaire de génération : domaine (libre + suggestions), niveau et profil de personnalité.
import { useState } from 'react';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import { clientGeneratorApi } from '../api.js';

const RANDOM = { id: 'RANDOM', label: 'Aléatoire', description: 'Laissez le hasard choisir le caractère du client.' };

export default function GenerateScenarioForm({ options, onGenerated }) {
  const [form, setForm] = useState({ domain: '', level: 'BEGINNER', personality: 'RANDOM' });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setError(null);
    setGenerating(true);
    try {
      const scenario = await clientGeneratorApi.generateScenario(form);
      onGenerated(scenario);
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    generate();
  }

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form className="card cg-form" onSubmit={handleSubmit} aria-busy={generating}>
      <div className="cg-form-row">
        <label>
          Domaine d'activité
          <input
            value={form.domain}
            onChange={(event) => set('domain', event.target.value)}
            placeholder="ex. Santé, Logistique, Tourisme"
            required
            minLength={2}
            maxLength={80}
          />
          <span className="cg-suggestions" aria-label="Domaines suggérés">
            {options.domains.map((domain) => (
              <button
                key={domain}
                type="button"
                className={`cg-suggestion ${form.domain === domain ? 'is-selected' : ''}`}
                onClick={() => set('domain', domain)}
              >
                {domain}
              </button>
            ))}
          </span>
        </label>
        <label>
          Niveau de difficulté
          <select value={form.level} onChange={(event) => set('level', event.target.value)}>
            {options.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
          <span className="field-hint">{options.levels.find((level) => level.id === form.level)?.description}</span>
        </label>
      </div>

      <fieldset className="cg-fieldset">
        <legend>Personnalité du client</legend>
        <div className="cg-profiles">
          {[RANDOM, ...options.personalities].map((profile) => (
            <label key={profile.id} className={`choice ${form.personality === profile.id ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="personality"
                value={profile.id}
                checked={form.personality === profile.id}
                onChange={() => set('personality', profile.id)}
              />
              <strong>{profile.label}</strong>
              <span>{profile.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ErrorMessage error={error} onRetry={generate} />

      <div className="cg-form-footer">
        <span className="muted small">Le besoin caché n'est jamais affiché : à vous de le découvrir pendant l'entretien.</span>
        <button type="submit" className="btn" disabled={generating}>
          {generating ? 'Génération…' : 'Générer un client'}
        </button>
      </div>
    </form>
  );
}
