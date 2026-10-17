// Route protégée : redirige vers /login si l'utilisateur n'est pas connecté
// et refuse l'accès si son rôle ne fait pas partie de `roles`.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Loader from '../components/Loader.jsx';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Chargement de la session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h2>Accès refusé</h2>
        <p>Cette page n'est pas accessible avec votre rôle.</p>
      </div>
    );
  }
  return <Outlet />;
}
