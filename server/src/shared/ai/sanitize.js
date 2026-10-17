// Protection des données personnelles : rien de ce qui identifie l'étudiant
// (nom, prénom, email) ne doit être envoyé au LLM.

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const EMAIL_MASK = '[email masqué]';
const NAME_MASK = '[étudiant]';

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Masque les emails et, si l'identité est fournie, le prénom et le nom de l'étudiant.
 * @param {string} text
 * @param {{ firstName?: string, lastName?: string, email?: string } | null} identity
 */
export function sanitizeText(text, identity) {
  if (typeof text !== 'string') return text;
  let clean = text.replace(EMAIL_PATTERN, EMAIL_MASK);

  for (const part of [identity?.firstName, identity?.lastName]) {
    const name = part?.trim();
    if (!name || name.length < 2) continue;
    const pattern = new RegExp(`(?<!\\p{L})${escapeRegExp(name)}(?!\\p{L})`, 'giu');
    clean = clean.replace(pattern, NAME_MASK);
  }
  return clean;
}

/** Applique sanitizeText à toutes les chaînes d'une structure (objet, tableau). */
export function sanitizeDeep(value, identity) {
  if (typeof value === 'string') return sanitizeText(value, identity);
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item, identity));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeDeep(child, identity)]));
  }
  return value;
}
