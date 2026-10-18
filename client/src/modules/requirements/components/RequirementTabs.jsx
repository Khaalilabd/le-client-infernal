// Onglets par type d'exigence, avec le nombre d'exigences de chaque type.
import { TABS } from '../requirements.constants.js';

export default function RequirementTabs({ requirements, active, onChange }) {
  const count = (tab) => (tab === 'ALL' ? requirements.length : requirements.filter((item) => item.type === tab).length);

  return (
    <div className="tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tab${active === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label} <span className="badge">{count(tab.id)}</span>
        </button>
      ))}
    </div>
  );
}
