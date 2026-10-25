// Indicateur de progression : nombre de questions posées et niveau de découverte (sans révéler le besoin caché)
import { useEffect, useState } from 'react';
import { interviewApi } from '../api.js';
import '../interview.css';

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

// Types de question déterminés par l'analyse du client (Chain-of-Thought, côté serveur)
const QUESTION_TYPE_LABELS = [
  ['OPEN', 'ouverte', 'ouvertes'],
  ['CLOSED', 'fermée', 'fermées'],
  ['TECHNICAL', 'technique', 'techniques'],
  ['OFF_TOPIC', 'hors sujet', 'hors sujet'],
  ['MANIPULATION', 'hors cadre', 'hors cadre'],
];

function QuestionTypes({ counts }) {
  const items = QUESTION_TYPE_LABELS.filter(([type]) => counts[type] > 0);
  if (items.length === 0) return null;
  return (
    <div className="iv-question-types">
      <p className="small" style={{ margin: '12px 0 6px', fontWeight: 600 }}>Vos questions</p>
      <ul>
        {items.map(([type, singular, plural]) => (
          <li key={type} className={`iv-qt iv-qt-${type.toLowerCase()}`}>
            <strong>{counts[type]}</strong> {counts[type] > 1 ? plural : singular}
          </li>
        ))}
      </ul>
      {counts.OPEN <= counts.CLOSED + counts.TECHNICAL + counts.OFF_TOPIC && (
        <p className="muted small" style={{ margin: '6px 0 0' }}>
          Astuce : les questions ouvertes (« pourquoi ? », « comment faites-vous aujourd'hui ? ») font davantage parler le client.
        </p>
      )}
    </div>
  );
}

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
      {progress.questionTypes && <QuestionTypes counts={progress.questionTypes} />}
    </div>
  );
}
