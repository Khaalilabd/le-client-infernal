import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { modules } from '../../modules/index.js';

export default function HomePage() {
  const { user } = useAuth();
  const visibleModules = modules.filter((module) => module.roles.includes(user.role));

  return (
    <section>
      <h1>Bonjour {user.firstName}</h1>
      <p className="muted">
        Entraînez-vous au recueil des besoins : interrogez un client exigeant, découvrez son vrai besoin, rédigez le cahier
        des charges et gérez ses demandes de changement.
      </p>
      <div className="grid">
        {visibleModules.map((module) => (
          <Link key={module.id} to={`/${module.path}`} className="card module-card">
            <h2>{module.label}</h2>
            <p>{module.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
