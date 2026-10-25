// Notes de chaque étape d'une séance et note finale (règle commune : server/src/shared/sessions/sessionScore.js).
import { STEP_LABELS, barClass, formatScore } from '../format.js';

export function ScoreBreakdown({ breakdown, finalScore, completed }) {
  const shown = completed ? finalScore : breakdown.finalScore;
  return (
    <div className="db-breakdown">
      <div className="criteria">
        {Object.entries(STEP_LABELS).map(([key, label]) => {
          const value = breakdown.components[key];
          return (
            <div key={key}>
              <div className="criterion-head">
                <span>
                  {label} <span className="muted">({Math.round(breakdown.weights[key] * 100)} %)</span>
                </span>
                <span>{typeof value === 'number' ? `${formatScore(value)} / 100` : 'pas encore noté'}</span>
              </div>
              <div className={barClass(value ?? 0)}>
                <span style={{ width: `${Math.min(100, value ?? 0)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="db-final">
        <div className="score">
          <span className="score-value">{formatScore(shown)}</span>
          <span className="score-max">/ 100</span>
        </div>
        <span className="muted small">{completed ? 'Note finale' : 'Note provisoire'}</span>
      </div>
    </div>
  );
}
