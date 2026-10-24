// Indicateur de progression : nombre de questions posées et niveau de découverte (sans révéler le besoin caché)
import { useEffect, useState } from 'react';
import { interviewApi } from '../api.js';

const DISCOVERY_LABELS = {
  LOW: 'Exploration initiale',
  MEDIUM: 'En bonne voie',
  HIGH: 'Découverte avancée',
};

const DISCOVERY_BAR_CLASS = {
  LOW: 'bar-warning',
  MEDIUM: 'bar-warning',
  HIGH: 'bar-success',
};

export default function ProgressIndicator({ sessionId, messagesCount = 0 }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    interviewApi
      .getProgress(sessionId)
      .then(setProgress)
      .catch(console.error);
  }, [sessionId, messagesCount]); // Se rafraîchit quand le nombre de messages change

  if (!progress) return null;

  const percentage = Math.min(100, (progress.questionsCount / progress.recommendedQuestions.max) * 100);

  return (
    <div className="card">
      <h4>Votre entretien</h4>
      <p className="muted small" style={{ margin: '4px 0 8px' }}>
        {progress.questionsCount} question{progress.questionsCount > 1 ? 's' : ''} posée{progress.questionsCount > 1 ? 's' : ''} ·
        objectif conseillé : {progress.recommendedQuestions.min} à {progress.recommendedQuestions.max}
      </p>
      <div className={`bar ${DISCOVERY_BAR_CLASS[progress.discoveryLevel]}`}>
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="muted small" style={{ marginTop: '8px' }}>
        {DISCOVERY_LABELS[progress.discoveryLevel]}
      </p>
    </div>
  );
}
