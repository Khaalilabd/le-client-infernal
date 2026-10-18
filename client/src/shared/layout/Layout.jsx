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
          <span className="brand-mark" aria-hidden="true">CI</span>
          <span>
            Le Client <span>Infernal</span>
          </span>
        </NavLink>
        <div className="user-box">
          <span className="user-meta">
            {user.firstName} {user.lastName}
            <em>{ROLE_LABELS[user.role]}</em>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="app-nav" aria-label="Modules">
          <NavLink to="/" end>
            <span className="nav-index" aria-hidden="true">◆</span>
            Accueil
          </NavLink>
          <span className="nav-section">Parcours</span>
          {visibleModules.map((module, index) => (
            <NavLink key={module.id} to={`/${module.path}`}>
              <span className="nav-index" aria-hidden="true">{index + 1}</span>
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
