import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { modules } from '../../modules/index.js';

const JOURNEY = ['Choisir un client', "Mener l'entretien", 'Rédiger le cahier des charges', 'Gérer les changements', 'Suivre ses progrès'];

export default function HomePage() {
  const { user } = useAuth();
  const visibleModules = modules.filter((module) => module.roles.includes(user.role));

  return (
    <section>
      <PageHeader
        eyebrow="Accueil"
        title={`Bonjour ${user.firstName}`}
        description="Interrogez un client exigeant, découvrez son vrai besoin, rédigez le cahier des charges et gérez ses demandes de changement."
        actions={
          user.role === 'STUDENT' && (
            <Link to="/client-generator" className="btn">
              Nouvelle séance
            </Link>
          )
        }
      />

      <ol className="stepper" aria-label="Parcours d'une séance">
        {JOURNEY.map((label) => (
          <li key={label} className="step">
            {label}
          </li>
        ))}
      </ol>

      <div className="grid">
        {visibleModules.map((module, index) => (
          <Link key={module.id} to={`/${module.path}`} className="card module-card">
            <span className="nav-index">{index + 1}</span>
            <h2>{module.label}</h2>
            <p>{module.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
