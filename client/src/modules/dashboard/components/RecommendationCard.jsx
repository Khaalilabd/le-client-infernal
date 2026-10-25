import { Link } from 'react-router-dom';

// Carte de recommandation du prochain scénario (analysée par l'IA)
export function RecommendationCard({ recommendation }) {
  if (!recommendation) {
    return null;
  }

  const getLevelLabel = (level) => {
    const levels = {
      BEGINNER: 'Débutant',
      INTERMEDIATE: 'Intermédiaire',
      ADVANCED: 'Avancé',
    };
    return levels[level] || level;
  };

  const getLevelColor = (level) => {
    const colors = {
      BEGINNER: 'info',
      INTERMEDIATE: 'primary',
      ADVANCED: 'danger',
    };
    return colors[level] || 'secondary';
  };

  // Construction de l'URL avec les paramètres recommandés
  const generateScenarioUrl = () => {
    const params = new URLSearchParams({
      domain: recommendation.domain,
      level: recommendation.level,
    });
    if (recommendation.personality) {
      params.append('personality', recommendation.personality);
    }
    return `/client-generator?${params.toString()}`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>🎯 Recommandation personnalisée</h3>
      </div>
      <div className="card-body">
        {/* Points faibles identifiés */}
        {recommendation.weaknesses && recommendation.weaknesses.length > 0 && (
          <div className="mb-3">
            <h4 className="text-small text-muted">Points à travailler :</h4>
            <ul className="list-simple">
              {recommendation.weaknesses.map((weakness, index) => (
                <li key={index}>⚠️ {weakness}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Scénario recommandé */}
        <div className="recommendation-content">
          <div className="mb-2">
            <strong>Domaine suggéré :</strong> {recommendation.domain}
          </div>
          <div className="mb-2">
            <strong>Niveau :</strong>{' '}
            <span className={`badge badge-${getLevelColor(recommendation.level)}`}>
              {getLevelLabel(recommendation.level)}
            </span>
          </div>
          {recommendation.personality && (
            <div className="mb-2">
              <strong>Personnalité du client :</strong> {recommendation.personality}
            </div>
          )}
          <div className="mb-2">
            <strong>Compétence ciblée :</strong> {recommendation.focusSkill}
          </div>
        </div>

        {/* Justification de l'IA */}
        <div className="alert alert-info mt-3">
          <strong>💡 Pourquoi ce scénario ?</strong>
          <p className="mb-0 mt-1">{recommendation.rationale}</p>
        </div>

        {/* Bouton pour lancer le scénario */}
        <div className="mt-3">
          <Link to={generateScenarioUrl()} className="btn btn-primary btn-block">
            🚀 Lancer ce scénario
          </Link>
        </div>
      </div>
    </div>
  );
}
