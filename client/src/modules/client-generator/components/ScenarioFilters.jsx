// Filtres de la liste des scénarios.
export const EMPTY_FILTERS = { domain: '', level: '', personality: '' };

export default function ScenarioFilters({ options, filters, onChange }) {
  const set = (field) => (event) => onChange({ ...filters, [field]: event.target.value });
  const active = Object.values(filters).some(Boolean);

  return (
    <div className="cg-filters" role="search">
      <label>
        Domaine
        <input value={filters.domain} onChange={set('domain')} placeholder="Rechercher…" />
      </label>
      <label>
        Niveau
        <select value={filters.level} onChange={set('level')}>
          <option value="">Tous les niveaux</option>
          {options.levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Personnalité
        <select value={filters.personality} onChange={set('personality')}>
          <option value="">Toutes</option>
          {options.personalities.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
      </label>
      {active && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(EMPTY_FILTERS)}>
          Réinitialiser
        </button>
      )}
    </div>
  );
}
