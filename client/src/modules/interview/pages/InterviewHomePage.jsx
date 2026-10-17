import { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import SessionPicker, { useSelectedSessionId } from '../../../shared/components/SessionPicker.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import { interviewApi } from '../api.js';

export default function InterviewHomePage() {
  const { user } = useAuth();
  const sessionId = useSelectedSessionId();
  const [messages, setMessages] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setMessages(null);
    setError(null);
    interviewApi.listMessages(sessionId).then(setMessages).catch(setError);
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

  return (
    <section>
      <h1>Entretien client</h1>
      <p className="muted">
        Le client ne révèle son véritable besoin que si vos questions s'en approchent. Posez des questions ouvertes !
      </p>
      <SessionPicker />
      <ErrorMessage error={error} />
      {sessionId && (messages === null && !error ? (
        <Loader />
      ) : (
        <ChatWindow
          messages={messages ?? []}
          onSend={handleSend}
          sending={sending}
          disabled={user.role !== 'STUDENT'}
        />
      ))}
    </section>
  );
}
