// Libellés et mises en forme communs aux pages du tableau de bord.

export const LEVEL_LABELS = { BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' };

export const STATUS_BADGES = {
  IN_PROGRESS: { label: 'En cours', className: 'badge-info' },
  COMPLETED: { label: 'Terminée', className: 'badge-success' },
  ABANDONED: { label: 'Abandonnée', className: '' },
};

export const STEP_LABELS = {
  interview: 'Entretien',
  requirements: 'Cahier des charges',
  changeRequests: 'Demandes de changement',
};

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

/** Note sur 100 sans décimale inutile (72 ou 72,5). */
export function formatScore(value) {
  return typeof value === 'number' ? value.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—';
}

export const barClass = (value) => (value >= 60 ? 'bar bar-success' : 'bar bar-warning');
