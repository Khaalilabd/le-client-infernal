// Critère de la grille avec sa jauge (maquette 06) : vert ≥ 70 %, orange ≥ 50 %, rouge en dessous.
export default function CriterionBar({ criterion }) {
  const percent = Math.round((criterion.score / criterion.maxScore) * 100);
  const variant = percent >= 70 ? ' bar-success' : percent >= 50 ? ' bar-warning' : '';

  return (
    <div>
      <div className="criterion-head">
        <span>{criterion.name}</span>
        <span>
          {criterion.score} / {criterion.maxScore}
        </span>
      </div>
      <div
        className={`bar${variant}`}
        role="meter"
        aria-label={criterion.name}
        aria-valuemin={0}
        aria-valuemax={criterion.maxScore}
        aria-valuenow={criterion.score}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="muted small requirements-criterion-comment">{criterion.comment}</p>
    </div>
  );
}
