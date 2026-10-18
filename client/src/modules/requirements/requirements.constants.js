// Libellés et règles partagés par les pages du module requirements.

export const TYPE_LABELS = {
  FUNCTIONAL: 'Fonctionnelle',
  NON_FUNCTIONAL: 'Non fonctionnelle',
  USER_STORY: 'User story',
};

export const TABS = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'FUNCTIONAL', label: 'Fonctionnelles' },
  { id: 'NON_FUNCTIONAL', label: 'Non fonctionnelles' },
  { id: 'USER_STORY', label: 'User stories' },
];

export const CODE_PREFIXES = { FUNCTIONAL: 'EF', NON_FUNCTIONAL: 'ENF', USER_STORY: 'US' };

export const PRIORITIES = [
  { id: 'MUST', label: 'MUST', hint: 'indispensable' },
  { id: 'SHOULD', label: 'SHOULD', hint: 'important' },
  { id: 'COULD', label: 'COULD', hint: 'souhaitable' },
  { id: 'WONT', label: 'WONT', hint: 'pas pour cette version' },
];

export const STATUS_LABELS = {
  DRAFT: { label: 'Brouillon', badge: 'badge-info' },
  SUBMITTED: { label: 'Soumis', badge: 'badge-warning' },
  EVALUATED: { label: 'Évalué', badge: 'badge-success' },
};

export const USER_STORY_TEMPLATE = 'En tant que …, je veux … afin de …';
export const USER_STORY_FORMAT = /en tant qu[e'’].+je (veux|souhaite|voudrais).+afin (de|d['’]|que)/i;

/**
 * Code de la prochaine exigence d'un type : plus grand numéro existant + 1.
 * Les codes restent stables (pas de renumérotation après une suppression) pour comparer les versions.
 */
export function nextCode(requirements, type) {
  const prefix = CODE_PREFIXES[type];
  const numbers = requirements
    .map((requirement) => requirement.code.match(new RegExp(`^${prefix}-(\\d+)$`)))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return `${prefix}-${String(Math.max(0, ...numbers) + 1).padStart(2, '0')}`;
}

/** Exigence au format attendu par l'API (sans identifiants techniques). */
export function toInput({ type, code, title, description, priority, acceptanceCriteria }) {
  return { type, code, title, description, priority, ...(acceptanceCriteria?.length ? { acceptanceCriteria } : {}) };
}

/** « 1 exigence », « 3 exigences ». */
export function formatCount(count) {
  return `${count} exigence${count > 1 ? 's' : ''}`;
}

/** Lien vers une page du module en gardant la séance dans l'URL. */
export function modulePath(page, sessionId) {
  return `/requirements${page ? `/${page}` : ''}${sessionId ? `?session=${encodeURIComponent(sessionId)}` : ''}`;
}
