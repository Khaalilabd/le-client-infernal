// Compétences de l'étudiant (barres de la maquette 08), calculées à partir des évaluations des modules.
import { barClass, formatScore } from '../format.js';

const SKILLS = [
  ['discovery', 'Découverte du besoin', 'Critère « Couverture du besoin réel » du cahier des charges'],
  ['requirements', 'Rédaction des exigences', 'Note globale des cahiers des charges'],
  ['changes', 'Gestion des changements', 'Note des réponses aux demandes de changement'],
];

export function SkillsCard({ skills }) {
  return (
    <div className="card">
      <h4>Compétences</h4>
      <div className="criteria" style={{ marginTop: 'var(--space-3)' }}>
        {SKILLS.map(([key, label, hint]) => {
          const value = skills?.[key];
          return (
            <div key={key} title={hint}>
              <div className="criterion-head">
                <span>{label}</span>
                <span>{typeof value === 'number' ? `${formatScore(value)} %` : '—'}</span>
              </div>
              <div className={barClass(value ?? 0)}>
                <span style={{ width: `${Math.min(100, value ?? 0)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
