import { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import SessionPicker, { useSelectedSessionId } from '../../../shared/components/SessionPicker.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import ChangeRequestCard from '../components/ChangeRequestCard.jsx';
import { changeRequestsApi } from '../api.js';

export default function ChangeRequestsHomePage() {
  const { user } = useAuth();
  const sessionId = useSelectedSessionId();
  const [changeRequests, setChangeRequests] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setChangeRequests(null);
    setError(null);
    changeRequestsApi.list(sessionId).then(setChangeRequests).catch(setError);
  }, [sessionId]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const changeRequest = await changeRequestsApi.generate(sessionId);
      setChangeRequests((current) => [...(current ?? []), changeRequest]);
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section>
      <h1>Demandes de changement</h1>
      <p className="muted">En cours de projet, le client change d'avis. À vous de décider : accepter, négocier ou refuser.</p>
      <SessionPicker />
      <ErrorMessage error={error} />
      {sessionId && user.role === 'STUDENT' && (
        <button type="button" className="btn" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Le client rédige sa demande…' : 'Recevoir une nouvelle demande'}
        </button>
      )}
      {sessionId &&
        (changeRequests === null && !error ? (
          <Loader />
        ) : (
          <div className="stack">
            {(changeRequests ?? []).map((changeRequest) => (
              <ChangeRequestCard key={changeRequest.id} changeRequest={changeRequest} />
            ))}
          </div>
        ))}
    </section>
  );
}
