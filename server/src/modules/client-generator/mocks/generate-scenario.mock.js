// Réponse simulée du prompt generate-scenario (fournisseur mock, aucune clé API nécessaire).
// Le scénario varie selon le domaine, le niveau et le profil de personnalité, et respecte
// les mêmes règles que le vrai LLM (schéma Zod, nombre de contraintes selon le niveau).
import { FAMILIES, GENERIC_FAMILY, PROFILE_STYLES } from './scenario-templates.js';

const CONSTRAINT_COUNT = { BEGINNER: 2, INTERMEDIATE: 3, ADVANCED: 5 };
const LEVEL_FROM_LABEL = { débutant: 'BEGINNER', intermédiaire: 'INTERMEDIATE', avancé: 'ADVANCED' };

function findFamily(domain = '') {
  const text = domain.toLowerCase();
  return FAMILIES.find((family) => family.keywords.some((keyword) => text.includes(keyword))) ?? GENERIC_FAMILY;
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

export default function generateScenarioMock({ variables }, random = Math.random) {
  const domain = variables.domain ?? 'Général';
  const levelId = variables.levelId ?? LEVEL_FROM_LABEL[variables.level] ?? 'BEGINNER';
  const style = PROFILE_STYLES[variables.personalityId] ?? PROFILE_STYLES.COOPERATIVE;
  const family = findFamily(domain);

  // Évite de reproduire un titre déjà existant quand c'est possible
  const existing = String(variables.existingTitles ?? '');
  const fresh = family.situations.filter((situation) => !existing.includes(`${situation.org} : ${situation.subject}`));
  const situation = pick(fresh.length ? fresh : family.situations, random);

  const constraints = [...family.constraints].sort(() => random() - 0.5).slice(0, CONSTRAINT_COUNT[levelId]);

  return {
    title: `${situation.org} : ${situation.subject}`,
    clientName: situation.clientName,
    clientRole: situation.clientRole,
    companyName: `${situation.org} (fictif)`,
    personality: {
      traits: style.traits,
      communicationStyle: style.communicationStyle,
      mood: style.mood,
    },
    context: situation.context,
    expressedNeed: style.phrase(situation.expressedNeed),
    hiddenNeed: situation.hiddenNeed,
    implicitConstraints: constraints,
  };
}
