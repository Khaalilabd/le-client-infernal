// Graphique de progression : note finale de chaque séance terminée (SVG, sans bibliothèque).
import { formatDate, formatScore } from '../format.js';

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 24, right: 24, bottom: 32, left: 40 };
// Marge entre l'axe et le premier / dernier point, pour que les étiquettes ne chevauchent pas l'axe
const INSET = 36;
const GRID = [0, 25, 50, 75, 100];

export function ProgressChart({ points }) {
  if (!points || points.length === 0) {
    return <p className="muted small">Terminez une séance pour voir apparaître votre progression.</p>;
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = (index) =>
    PADDING.left + (points.length === 1 ? innerWidth / 2 : INSET + (index * (innerWidth - 2 * INSET)) / (points.length - 1));
  const y = (score) => PADDING.top + innerHeight - (score / 100) * innerHeight;
  const path = points.map((point, index) => `${x(index)},${y(point.finalScore)}`).join(' ');

  return (
    <svg
      className="db-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Notes finales : ${points.map((point) => formatScore(point.finalScore)).join(', ')} sur 100`}
    >
      {GRID.map((value) => (
        <g key={value}>
          <line className="db-chart-grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(value)} y2={y(value)} />
          <text className="db-chart-axis" x={PADDING.left - 8} y={y(value) + 4} textAnchor="end">
            {value}
          </text>
        </g>
      ))}
      {points.length > 1 && <polyline className="db-chart-line" points={path} />}
      {points.map((point, index) => (
        <g key={point.sessionId}>
          <circle className="db-chart-point" cx={x(index)} cy={y(point.finalScore)} r="5">
            <title>{`${point.title} — ${formatScore(point.finalScore)} / 100 (${formatDate(point.completedAt)})`}</title>
          </circle>
          <text className="db-chart-value" x={x(index)} y={y(point.finalScore) - 10} textAnchor="middle">
            {formatScore(point.finalScore)}
          </text>
          <text className="db-chart-axis" x={x(index)} y={HEIGHT - 8} textAnchor="middle">
            {`S${index + 1}`}
          </text>
        </g>
      ))}
    </svg>
  );
}
