import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [interviewState, setInterviewState] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setMessages(null);
    setSession(null);
    setError(null);
    setSummary(null);
    setInterviewState(null);

    // Charge les messages, la séance et l'état de l'entretien (terminé ou non)
    Promise.all([interviewApi.listMessages(sessionId), http.get(`/sessions/${sessionId}`), interviewApi.getSummary(sessionId)])
      .then(([msgs, sessionData, state]) => {
        setMessages(msgs);
        setSession(sessionData.session);
        setInterviewState(state);
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
    setShowConfirmModal(false);
    setEndingInterview(true);
    setError(null);
    try {
      const interviewSummary = await interviewApi.endInterview(sessionId);
      setSummary(interviewSummary);
      setInterviewState({ ended: true, summary: interviewSummary });
    } catch (err) {
      setError(err);
    } finally {
      setEndingInterview(false);
    }
  }

  // L'entretien est terminé (synthèse enregistrée) ; la séance, elle, continue avec le cahier des charges.
  const isCompleted = Boolean(interviewState?.ended) || session?.status === 'COMPLETED';
  const canEnd = user.role === 'STUDENT' && !isCompleted;

  return (
    <section>
      <PageHeader 
        eyebrow="Module 2" 
        title="Entretien client"
        description="Le client ne révèle son véritable besoin que si vos questions s'en approchent. Posez des questions ouvertes !"
        actions={canEnd && (
          <button className="btn btn-secondary" onClick={() => setShowConfirmModal(true)} disabled={endingInterview}>
            {endingInterview ? 'Finalisation…' : 'Terminer l\'entretien'}
          </button>
        )}
      />

      <SessionPicker />

      {isCompleted && (
        <div className="alert alert-success" style={{ marginTop: '16px' }}>
          <strong>Entretien terminé</strong>
          Vous avez terminé cet entretien. Vous pouvez consulter l'historique des messages ci-dessous, puis rédiger votre
          cahier des charges.
          <div className="alert-actions">
            {interviewState?.summary && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSummary(interviewState.summary)}>
                Revoir la synthèse
              </button>
            )}
            <Link to={`/requirements?session=${sessionId}`} className="btn btn-sm">
              Passer au cahier des charges
            </Link>
          </div>
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

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Terminer l'entretien</h2>
            </div>
            <div className="modal-body">
              <p>
                <strong>Êtes-vous sûr de vouloir terminer cet entretien ?</strong>
              </p>
              <p>
                Cette action est <strong>irréversible</strong>. Une fois l'entretien terminé, vous ne pourrez plus poser de questions au client.
              </p>
              <p className="text-muted" style={{ fontSize: '0.9em', marginTop: '12px' }}>
                💡 Assurez-vous d'avoir exploré tous les aspects importants du besoin avant de continuer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Annuler
              </button>
              <button className="btn btn-danger" onClick={handleEndInterview}>
                Oui, terminer l'entretien
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
