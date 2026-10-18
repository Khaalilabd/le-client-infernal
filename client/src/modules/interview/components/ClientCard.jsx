// Fiche du client : informations publiques uniquement (nom, fonction, personnalité, contexte, demande)
import { useEffect, useState } from 'react';
import { http } from '../../../shared/api/http.js';

export default function ClientCard({ sessionId }) {
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    http
      .get(`/sessions/${sessionId}`)
      .then((data) => setScenario(data.session.scenario))
      .catch(console.error);
  }, [sessionId]);

  if (!scenario) return null;

  // Génère les initiales du nom du client
  const initials = scenario.clientName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Récupère les traits de personnalité
  const traits = scenario.personality?.traits || [];

  return (
    <div className="card client-card">
      <div className="client-card-head">
        <div className="avatar avatar-lg">{initials}</div>
        <div>
          <h3>{scenario.clientName}</h3>
          <span className="muted small">
            {scenario.clientRole} — {scenario.companyName}
          </span>
        </div>
      </div>
      {traits.length > 0 && (
        <div className="cluster">
          {traits.map((trait, index) => (
            <span key={index} className="chip">
              {trait}
            </span>
          ))}
        </div>
      )}
      <dl>
        <dt>Ce qu'il demande</dt>
        <dd>« {scenario.expressedNeed} »</dd>
        <dt>Contexte</dt>
        <dd className="small">{scenario.context}</dd>
      </dl>
    </div>
  );
}
