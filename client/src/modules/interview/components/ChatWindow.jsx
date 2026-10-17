// Fenêtre de chat entre l'étudiant (ingénieur) et le client simulé.
import { useEffect, useRef, useState } from 'react';

export default function ChatWindow({ messages, onSend, sending, disabled }) {
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSubmit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    const sent = await onSend(content);
    if (sent) setDraft('');
  }

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.length === 0 && <p className="muted">Commencez l'entretien en posant votre première question.</p>}
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.sender === 'STUDENT' ? 'from-student' : 'from-client'}`}>
            <span className="chat-author">{message.sender === 'STUDENT' ? 'Vous' : 'Client'}</span>
            {message.content}
          </div>
        ))}
        {sending && <div className="chat-bubble from-client muted">Le client réfléchit…</div>}
        <div ref={endRef} />
      </div>
      {!disabled && (
        <form className="chat-input" onSubmit={handleSubmit}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Posez une question au client…"
            rows={2}
            maxLength={2000}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) handleSubmit(event);
            }}
          />
          <button type="submit" className="btn" disabled={sending || !draft.trim()}>
            Envoyer
          </button>
        </form>
      )}
    </div>
  );
}
