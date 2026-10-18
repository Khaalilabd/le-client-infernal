// Catalogue du module : niveaux, profils de personnalité et domaines suggérés.
// Les données éditables sont dans data/*.json.
import { readFileSync } from 'node:fs';

function loadData(file) {
  return JSON.parse(readFileSync(new URL(`./data/${file}`, import.meta.url), 'utf8'));
}

export const PERSONALITY_PROFILES = loadData('personalities.json');
export const PROFILE_IDS = PERSONALITY_PROFILES.map((profile) => profile.id);
export const RANDOM_PROFILE = 'RANDOM';

export const DOMAIN_SUGGESTIONS = loadData('domains.json');

export const LEVELS = [
  { id: 'BEGINNER', label: 'Débutant', description: 'Client coopératif, besoin caché proche de la demande.' },
  { id: 'INTERMEDIATE', label: 'Intermédiaire', description: 'Client flou, besoin caché nettement différent.' },
  { id: 'ADVANCED', label: 'Avancé', description: 'Client difficile, besoin caché bien dissimulé.' },
];
export const LEVEL_IDS = LEVELS.map((level) => level.id);

/** Nombre de contraintes implicites attendu selon le niveau (bornes incluses). */
export const IMPLICIT_CONSTRAINTS_RANGE = {
  BEGINNER: [1, 2],
  INTERMEDIATE: [2, 4],
  ADVANCED: [3, 6],
};

export function getLevel(levelId) {
  return LEVELS.find((level) => level.id === levelId);
}

export function getProfile(profileId) {
  return PERSONALITY_PROFILES.find((profile) => profile.id === profileId);
}

/** Renvoie le profil demandé, ou un profil tiré au sort si « aléatoire ». */
export function resolveProfile(profileId = RANDOM_PROFILE, random = Math.random) {
  if (profileId !== RANDOM_PROFILE) return getProfile(profileId);
  return PERSONALITY_PROFILES[Math.floor(random() * PERSONALITY_PROFILES.length)];
}
