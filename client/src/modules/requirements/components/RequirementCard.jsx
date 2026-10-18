// Carte d'une exigence (maquette 05) : code, titre, priorité, type, description et critères d'acceptation.
import { TYPE_LABELS, USER_STORY_FORMAT } from '../requirements.constants.js';

export default function RequirementCard({ requirement, isEditing, actions }) {
  const badFormat = requirement.type === 'USER_STORY' && !USER_STORY_FORMAT.test(requirement.description);

  return (
    <article className={`card requirements-card${isEditing ? ' is-editing' : ''}`}>
      <div className="card-header">
        <h3>
          {requirement.code} — {requirement.title}
        </h3>
        <div className="cluster">
          <span className="badge" title="Priorité MoSCoW">
            {requirement.priority}
          </span>
          {actions}
        </div>
      </div>
      <p className="muted small requirements-card-type">{TYPE_LABELS[requirement.type]}</p>
      <p className="requirements-card-text">{requirement.description}</p>
      {requirement.acceptanceCriteria?.length > 0 && (
        <ul className="small requirements-card-criteria" aria-label="Critères d'acceptation">
          {requirement.acceptanceCriteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      )}
      {badFormat && (
        <p className="field-hint requirements-card-warning">Format conseillé : « En tant que… je veux… afin de… ».</p>
      )}
    </article>
  );
}
