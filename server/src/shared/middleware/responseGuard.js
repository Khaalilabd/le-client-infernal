// Filet de sécurité : retire les champs secrets du scénario de TOUTE réponse JSON.
// Normalement les services utilisent toPublicScenario() ; si un champ secret passe
// quand même, il est supprimé ici et une alerte est écrite dans la console.
import { SECRET_SCENARIO_FIELDS } from '../serializers/scenario.js';

export function stripSecrets(value, found = []) {
  if (Array.isArray(value)) {
    return value.map((item) => stripSecrets(item, found));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {};
    for (const [key, child] of Object.entries(value)) {
      if (SECRET_SCENARIO_FIELDS.includes(key)) {
        found.push(key);
        continue;
      }
      clean[key] = stripSecrets(child, found);
    }
    return clean;
  }
  return value;
}

export function responseGuard(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const found = [];
    const clean = stripSecrets(body, found);
    if (found.length > 0) {
      console.error(
        `[responseGuard] Champ(s) secret(s) retiré(s) de ${req.method} ${req.originalUrl} : ${[...new Set(found)].join(', ')}. ` +
          'Utilisez toPublicScenario() dans le service concerné.',
      );
    }
    return originalJson(clean);
  };
  next();
}
