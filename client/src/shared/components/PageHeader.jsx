// En-tête standard d'une page de module : surtitre, titre, description et actions.
// Exemple : <PageHeader eyebrow="Module 2" title="Entretien client" description="…" actions={<button …/>} />
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
