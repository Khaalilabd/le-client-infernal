// Carte de recommandation du prochain scénario (analyse de l'IA, technique Few-shot) — maquette 08.
import { Link } from 'react-router-dom';
import { LEVEL_LABELS } from '../format.js';

/** Lien vers le générateur du module 1, pré-rempli avec le scénario recommandé. */
function generatorUrl({ domain, level, personality }) {
  const params = new URLSearchParams({ domain, level });
  if (personality) params.set('personality', personality);
  return `/client-generator?${params.toString()}`;
}

export function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;
  const fromAi = recommendation.source === 'AI';

  return (
    <div className="card db-recommendation">
      <span className="eyebrow">{fromAi ? 'Recommandation de l\'IA' : 'Pour bien commencer'}</span>
      <h3>
        {recommendation.domain} · {LEVEL_LABELS[recommendation.level] ?? recommendation.level}
      </h3>
      <p className="small">{recommendation.rationale}</p>
      {fromAi && (
        <>
          <strong className="small">Points à travailler</strong>
          <ul className="small">
            {recommendation.weaknesses.map((weakness) => (
              <li key={weakness}>{weakness}</li>
            ))}
          </ul>
        </>
      )}
      <div className="cluster">
        <span className="chip">Compétence : {recommendation.focusSkill}</span>
        {recommendation.personalityLabel && <span className="chip">Client : {recommendation.personalityLabel}</span>}
      </div>
      <div className="card-footer">
        <Link to={generatorUrl(recommendation)} className="btn btn-sm">
          Lancer ce scénario
        </Link>
      </div>
    </div>
  );
}
