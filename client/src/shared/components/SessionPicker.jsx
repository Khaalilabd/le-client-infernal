// Sélecteur de séance d'entraînement, partagé par les modules interview,
// change-requests et requirements. La séance choisie est gardée dans l'URL (?session=<id>)
// pour passer d'un module à l'autre sans la perdre.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sessionsApi } from '../api/sessions.js';
import ErrorMessage from './ErrorMessage.jsx';

export function useSelectedSessionId() {
  const [searchParams] = useSearchParams();
  return searchParams.get('session');
}

export default function SessionPicker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const selectedId = searchParams.get('session') ?? '';

  useEffect(() => {
    sessionsApi
      .list()
      .then((list) => {
        setSessions(list);
        if (!selectedId && list.length > 0) {
          setSearchParams({ session: list[0].id }, { replace: true });
        }
      })
      .catch(setError);
    // Chargement unique au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <ErrorMessage error={error} />;

  if (sessions.length === 0) {
    return (
      <p className="muted">
        Aucune séance. Choisissez un scénario dans le module « Générateur de clients » pour démarrer.
      </p>
    );
  }

  return (
    <label className="session-picker">
      Séance :
      <select value={selectedId} onChange={(event) => setSearchParams({ session: event.target.value })}>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.scenario.title} — {new Date(session.startedAt).toLocaleDateString('fr-FR')}
            {session.status !== 'IN_PROGRESS' ? ' (terminée)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
