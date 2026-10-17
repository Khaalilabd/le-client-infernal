import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import { sessionsApi } from '../../../shared/api/sessions.js';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import ScenarioCard, { LEVEL_LABELS } from '../components/ScenarioCard.jsx';
import { clientGeneratorApi } from '../api.js';

export default function ClientGeneratorHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState(null);
  const [form, setForm] = useState({ domain: '', level: 'BEGINNER' });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    clientGeneratorApi.listScenarios().then(setScenarios).catch(setError);
  }, []);

  async function handleGenerate(event) {
    event.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const scenario = await clientGeneratorApi.generateScenario(form);
      setScenarios((current) => [scenario, ...(current ?? [])]);
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleStart(scenario) {
    try {
      const session = await sessionsApi.create(scenario.id);
      navigate(`/interview?session=${session.id}`);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section>
      <h1>Générateur de clients</h1>
      <p className="muted">Choisissez un domaine et un niveau : l'IA invente un client fictif avec un besoin caché.</p>

      <form className="card form-inline" onSubmit={handleGenerate}>
        <label>
          Domaine
          <input
            value={form.domain}
            onChange={(event) => setForm({ ...form, domain: event.target.value })}
            placeholder="ex. Santé, Éducation, Logistique"
            required
            minLength={2}
          />
        </label>
        <label>
          Niveau
          <select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn" disabled={generating}>
          {generating ? 'Génération…' : 'Générer un client'}
        </button>
      </form>

      <ErrorMessage error={error} />

      <h2>Scénarios disponibles</h2>
      {scenarios === null ? (
        <Loader />
      ) : (
        <div className="grid">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStart={user.role === 'STUDENT' ? handleStart : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
