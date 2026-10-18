import { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import SessionPicker, { useSelectedSessionId } from '../../../shared/components/SessionPicker.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import PageHeader from '../../../shared/components/PageHeader.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import ClientCard from '../components/ClientCard.jsx';
import ProgressIndicator from '../components/ProgressIndicator.jsx';
import SummaryModal from '../components/SummaryModal.jsx';
import { interviewApi } from '../api.js';
import { http } from '../../../shared/api/http.js';

export default function InterviewHomePage() {
  const { user } = useAuth();
  const sessionId = useSelectedSessionId();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [endingInterview, setEndingInterview] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setMessages(null);
    setSession(null);
    setError(null);
    setSummary(null);

    // Charge les messages et les informations de séance
    Promise.all([interviewApi.listMessages(sessionId), http.get(`/sessions/${sessionId}`)])
      .then(([msgs, sessionData]) => {
        setMessages(msgs);
        setSession(sessionData.session);
      })
      .catch(setError);
  }, [sessionId]);

  async function handleSend(content) {
    setSending(true);
    setError(null);
    try {
      const { studentMessage, clientMessage } = await interviewApi.sendMessage(sessionId, content);
      setMessages((current) => [...current, studentMessage, clientMessage]);
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setSending(false);
    }
  }

  async function handleEndInterview() {
    if (!window.confirm('Êtes-vous sûr de vouloir terminer cet entretien ? Cette action est irréversible.')) {
      return;
    }

    setEndingInterview(true);
    setError(null);
    try {
      const interviewSummary = await interviewApi.endInterview(sessionId);
      setSummary(interviewSummary);
      // Recharge la séance pour mettre à jour le statut
      const sessionData = await http.get(`/sessions/${sessionId}`);
      setSession(sessionData.session);
    } catch (err) {
      setError(err);
    } finally {
      setEndingInterview(false);
    }
  }

  const isCompleted = session?.status === 'COMPLETED';
  const canEnd = user.role === 'STUDENT' && !isCompleted;

  return (
    <section>
      <PageHeader eyebrow="Module 2" title="Entretien client">
        <p>Le client ne révèle son véritable besoin que si vos questions s'en approchent. Posez des questions ouvertes !</p>
        {canEnd && (
          <button className="btn btn-secondary" onClick={handleEndInterview} disabled={endingInterview}>
            {endingInterview ? 'Finalisation…' : 'Terminer l\'entretien'}
          </button>
        )}
      </PageHeader>

      <SessionPicker />

      {isCompleted && (
        <div className="alert alert-success" style={{ marginTop: '16px' }}>
          <strong>Entretien terminé</strong>
          Vous avez terminé cet entretien. Vous pouvez consulter l'historique des messages ci-dessous.
        </div>
      )}

      {sessionId && session && (
        <ol className="stepper">
          <li className="step is-done">Scénario</li>
          <li className={`step ${isCompleted ? 'is-done' : 'is-current'}`}>Entretien</li>
          <li className="step">Cahier des charges</li>
          <li className="step">Changements</li>
          <li className="step">Évaluation</li>
        </ol>
      )}

      <ErrorMessage error={error} onRetry={error && error.message.includes('429') ? () => window.location.reload() : null} />

      {sessionId && (messages === null && !error ? (
        <Loader />
      ) : (
        <div className="split">
          <ChatWindow
            messages={messages ?? []}
            onSend={handleSend}
            sending={sending}
            disabled={user.role !== 'STUDENT' || isCompleted}
            clientName={session?.scenario?.clientName}
          />
          <aside className="stack" style={{ marginTop: 0 }}>
            <ClientCard sessionId={sessionId} />
            {!isCompleted && <ProgressIndicator sessionId={sessionId} messagesCount={messages?.length || 0} />}
            {!isCompleted && (
              <div className="alert alert-info" style={{ margin: 0 }}>
                <strong>Astuce</strong>
                Demandez « pourquoi » : le vrai besoin se cache souvent derrière un problème actuel.
              </div>
            )}
          </aside>
        </div>
      ))}

      {summary && <SummaryModal summary={summary} onClose={() => setSummary(null)} />}
    </section>
  );
}
