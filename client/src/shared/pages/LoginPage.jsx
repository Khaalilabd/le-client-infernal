import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import AuthLayout from '../layout/AuthLayout.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  return (
    <AuthLayout>
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div>
          <h1>Connexion</h1>
          <p className="muted">Connectez-vous pour reprendre votre entraînement.</p>
        </div>
        <ErrorMessage error={error} />
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
        </label>
        <label>
          Mot de passe
          <input type="password" value={form.password} onChange={update('password')} required autoComplete="current-password" />
        </label>
        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="muted">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
