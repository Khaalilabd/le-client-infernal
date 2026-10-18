import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import EmptyState from '../../../shared/components/EmptyState.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import GenerateScenarioForm from '../components/GenerateScenarioForm.jsx';
import ScenarioFilters, { EMPTY_FILTERS } from '../components/ScenarioFilters.jsx';
import ScenarioCard from '../components/ScenarioCard.jsx';
import { useClientGeneratorOptions, profileLabel } from '../hooks/useClientGeneratorOptions.js';
import { useScenarioActions } from '../hooks/useScenarioActions.js';
import { clientGeneratorApi } from '../api.js';
import '../client-generator.css';

const SEARCH_DELAY_MS = 300;

export default function ClientGeneratorHomePage() {
  const { user } = useAuth();
  const isStudent = user.role === 'STUDENT';
  const isTeacher = user.role === 'TEACHER';
  const { options, error: optionsError } = useClientGeneratorOptions();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [scenarios, setScenarios] = useState(null);
  const [listError, setListError] = useState(null);
  const { startSession, deleteScenario, actionError } = useScenarioActions({
    onDeleted: (deleted) => setScenarios((current) => current.filter((scenario) => scenario.id !== deleted.id)),
  });

  const loadScenarios = useCallback(() => {
    setListError(null);
    return clientGeneratorApi.listScenarios(filters).then(setScenarios).catch(setListError);
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(loadScenarios, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loadScenarios]);

  function handleGenerated(scenario) {
    setFilters(EMPTY_FILTERS);
    setScenarios((current) => [scenario, ...(current ?? []).filter((item) => item.id !== scenario.id)]);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <section>
      <PageHeader
        eyebrow="Module 1"
        title="Générateur de clients"
        description="Choisissez un domaine, un niveau et une personnalité : l'IA invente un client fictif avec un besoin caché à découvrir."
      />

      <ErrorMessage error={optionsError} />
      {options ? <GenerateScenarioForm options={options} onGenerated={handleGenerated} /> : !optionsError && <Loader />}

      <div className="cg-toolbar">
        <h2>Scénarios disponibles</h2>
        {options && <ScenarioFilters options={options} filters={filters} onChange={setFilters} />}
      </div>

      <ErrorMessage error={actionError} />
      <ErrorMessage error={listError} onRetry={loadScenarios} />

      {scenarios === null && !listError && <Loader label="Chargement des scénarios…" />}

      {scenarios?.length === 0 && (
        <EmptyState
          title={hasFilters ? 'Aucun scénario ne correspond à ces filtres' : 'Aucun scénario pour le moment'}
          description={
            hasFilters
              ? 'Modifiez ou réinitialisez les filtres pour voir les autres scénarios.'
              : 'Générez votre premier client avec le formulaire ci-dessus.'
          }
          action={
            hasFilters && (
              <button type="button" className="btn btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                Réinitialiser les filtres
              </button>
            )
          }
        />
      )}

      {scenarios?.length > 0 && (
        <div className="grid">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              personalityLabel={profileLabel(options, scenario.personality?.profile)}
              onStart={isStudent ? startSession : undefined}
              onDelete={isTeacher ? deleteScenario : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
