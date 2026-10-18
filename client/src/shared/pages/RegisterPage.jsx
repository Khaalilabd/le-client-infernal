import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import AuthLayout from '../layout/AuthLayout.jsx';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
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
        <h1>Créer un compte étudiant</h1>
        <ErrorMessage error={error} />
        <div className="row">
          <label>
            Prénom
            <input value={form.firstName} onChange={update('firstName')} required autoComplete="given-name" />
          </label>
          <label>
            Nom
            <input value={form.lastName} onChange={update('lastName')} required autoComplete="family-name" />
          </label>
        </div>
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
        </label>
        <label>
          Mot de passe (8 caractères minimum)
          <input type="password" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
        </label>
        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
        <p className="muted">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
