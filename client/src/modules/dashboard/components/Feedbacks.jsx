// Commentaires de l'enseignant sur une séance : liste et formulaire (maquette 09).
import { useState } from 'react';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import { dashboardApi } from '../api.js';
import { formatDate, formatScore } from '../format.js';

export function FeedbackList({ feedbacks }) {
  if (!feedbacks || feedbacks.length === 0) {
    return <p className="muted small">Aucun commentaire de l'enseignant pour le moment.</p>;
  }
  return (
    <div>
      {feedbacks.map((feedback) => (
        <div key={feedback.id} className="db-feedback">
          <strong className="small">
            {feedback.teacher.firstName} {feedback.teacher.lastName} · {formatDate(feedback.createdAt)}
            {typeof feedback.grade === 'number' && ` · ${formatScore(feedback.grade)} / 20`}
          </strong>
          <p>{feedback.comment}</p>
        </div>
      ))}
    </div>
  );
}

export function FeedbackForm({ sessionId, onAdded }) {
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const feedback = await dashboardApi.addTeacherFeedback(sessionId, {
        comment,
        ...(grade !== '' ? { grade: Number(grade) } : {}),
      });
      setComment('');
      setGrade('');
      onAdded(feedback);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stack" style={{ marginTop: 0 }} onSubmit={handleSubmit}>
      <label>
        Commentaire
        <textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} minLength={5} maxLength={3000} required />
      </label>
      <label>
        Note sur 20 (facultative)
        <input type="number" min={0} max={20} step={0.5} value={grade} onChange={(event) => setGrade(event.target.value)} />
      </label>
      <ErrorMessage error={error} />
      <button type="submit" className="btn" disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer le retour'}
      </button>
    </form>
  );
}
