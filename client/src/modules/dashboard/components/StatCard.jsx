export default function StatCard({ label, value, hint }) {
  return (
    <div className="card stat-card">
      <span className="stat-value">{value ?? '—'}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="muted">{hint}</span>}
    </div>
  );
}
