// Actions communes aux pages du module : démarrer une séance, supprimer un scénario.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsApi } from '../../../shared/api/sessions.js';
import { clientGeneratorApi } from '../api.js';

export function useScenarioActions({ onDeleted } = {}) {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState(null);

  async function startSession(scenario) {
    setActionError(null);
    try {
      const session = await sessionsApi.create(scenario.id);
      navigate(`/interview?session=${session.id}`);
    } catch (err) {
      setActionError(err);
    }
  }

  async function deleteScenario(scenario) {
    if (!window.confirm(`Supprimer le scénario « ${scenario.title} » ?`)) return;
    setActionError(null);
    try {
      await clientGeneratorApi.deleteScenario(scenario.id);
      onDeleted?.(scenario);
    } catch (err) {
      setActionError(err);
    }
  }

  return { startSession, deleteScenario, actionError };
}
