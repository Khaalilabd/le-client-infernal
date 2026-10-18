// Mise en page des écrans de connexion et d'inscription : bandeau de présentation + formulaire.
export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-hero">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">CI</span>
          Le Client Infernal
        </div>
        <div>
          <h1>Votre client ne dit jamais tout.</h1>
          <p>
            Entraînez-vous au recueil des besoins face à un client simulé par l'IA : questionnez-le, découvrez son vrai
            besoin, rédigez le cahier des charges et tenez bon face à ses demandes de changement.
          </p>
        </div>
        <p className="small">ESPRIT · IA for Software Engineering · 2026-2027</p>
      </aside>
      <div className="auth-panel">{children}</div>
    </div>
  );
}
