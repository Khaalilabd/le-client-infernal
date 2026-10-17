// Mise en page commune : en-tête, menu vers les modules, contenu de la page.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { modules } from '../../modules/index.js';

const ROLE_LABELS = { STUDENT: 'Étudiant', TEACHER: 'Enseignant' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleModules = modules.filter((module) => module.roles.includes(user.role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="brand">
          Le Client Infernal
        </NavLink>
        <div className="user-box">
          <span>
            {user.firstName} {user.lastName} · <em>{ROLE_LABELS[user.role]}</em>
          </span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="app-nav" aria-label="Modules">
          <NavLink to="/" end>
            Accueil
          </NavLink>
          {visibleModules.map((module) => (
            <NavLink key={module.id} to={`/${module.path}`}>
              {module.label}
            </NavLink>
          ))}
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
