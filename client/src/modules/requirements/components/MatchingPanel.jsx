// Correspondance entre le véritable besoin et les exigences (matching par l'IA).
// Le serveur n'envoie que des identifiants, des statuts et des codes : le texte des points reste secret,
// seuls leur numéro et les exigences qui les couvrent sont affichés.
const STATUS = {
  COVERED: { label: 'Couvert', badge: 'badge-success' },
  PARTIAL: { label: 'Partiel', badge: 'badge-warning' },
  MISSING: { label: 'Non couvert', badge: 'badge-danger' },
};

function PointList({ title, label, points }) {
  if (points.length === 0) return null;
  const covered = points.filter((point) => point.status === 'COVERED').length;
  return (
    <div>
      <div className="criterion-head">
        <span>{title}</span>
        <span>
          {covered} / {points.length} couvert{covered > 1 ? 's' : ''}
        </span>
      </div>
      <ul className="requirements-matching-list">
        {points.map((point, index) => (
          <li key={point.id}>
            <span>
              {label} {index + 1}
            </span>
            <span className={`badge ${STATUS[point.status].badge}`}>{STATUS[point.status].label}</span>
            <span className="muted small">
              {point.requirementCodes.length ? point.requirementCodes.join(', ') : 'aucune exigence'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MatchingPanel({ criteria }) {
  const [coverage, constraints] = criteria;
  // Les évaluations antérieures au matching n'ont pas ce détail.
  if (!coverage?.matching) return null;
  const unmatched = coverage.matching.unmatchedCodes ?? [];

  return (
    <div className="card">
      <h3 className="requirements-section-title">Correspondance avec le besoin réel</h3>
      <p className="muted small">
        L'IA a relié chaque point clé du véritable besoin aux exigences qui le traitent. Les notes de couverture en
        découlent : couvert = 1, partiel = ½.
      </p>
      <div className="criteria">
        <PointList title="Points clés du besoin" label="Point clé" points={coverage.matching.points} />
        <PointList title="Contraintes implicites" label="Contrainte" points={constraints?.matching?.points ?? []} />
      </div>
      {unmatched.length > 0 && (
        <p className="small requirements-matching-unmatched">
          Exigences sans lien avec le besoin réel : <strong>{unmatched.join(', ')}</strong>. Vérifiez qu'elles sont
          vraiment utiles au client.
        </p>
      )}
    </div>
  );
}
