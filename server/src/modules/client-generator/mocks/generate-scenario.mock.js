// Réponse simulée du prompt generate-scenario (fournisseur mock, aucune clé API nécessaire).
// Comme le vrai LLM, le mock lit les fiches métier injectées par le RAG ({{knowledge}}) et construit
// le scénario à partir de la première fiche complète, en citant sa source. Sans fiche (domaine
// inconnu), il utilise ses gabarits. Le scénario respecte les mêmes règles que le vrai LLM
// (schéma Zod, nombre de contraintes selon le niveau).
import { FAMILIES, GENERIC_FAMILY, PROFILE_STYLES } from './scenario-templates.js';

const CONSTRAINT_COUNT = { BEGINNER: 2, INTERMEDIATE: 3, ADVANCED: 5 };
const LEVEL_FROM_LABEL = { débutant: 'BEGINNER', intermédiaire: 'INTERMEDIATE', avancé: 'ADVANCED' };
const KNOWLEDGE_FIELDS = ['Organisation', 'Interlocuteur', 'Sujet', 'Situation actuelle', 'Demande typique', 'Besoin réel', 'Contraintes fréquentes'];
const ORGANISATION_NAMES = ['Les Oliviers', 'Les Jasmins', 'Le Phare', 'Le Cèdre', 'Les Palmiers', 'La Source', 'Horizon', 'El Amel'];
const CLIENT_NAMES = {
  female: ['Mme Amira Gharbi', 'Mme Leila Mansouri', 'Mme Sarra Bouazizi', 'Mme Rim Hammami'],
  male: ['M. Walid Chaabane', 'M. Anis Ferjani', 'M. Karim Jaziri', 'M. Mehdi Kallel'],
};

/** Nom accordé à la fonction (« Directrice » → Mme, « Directeur » → M.) ; fonction épicène : au hasard. */
function clientNameFor(role, random) {
  const firstWord = role.split(/[\s-]/)[0].toLowerCase();
  if (/(rice|euse|ente|ante|ère)$/.test(firstWord)) return pick(CLIENT_NAMES.female, random);
  if (/(eur|ier|ant|ent|ien)$/.test(firstWord) || / (associé|général)( |$)/.test(role)) return pick(CLIENT_NAMES.male, random);
  return pick([...CLIENT_NAMES.female, ...CLIENT_NAMES.male], random);
}

function findFamily(domain = '') {
  const text = domain.toLowerCase();
  return FAMILIES.find((family) => family.keywords.some((keyword) => text.includes(keyword))) ?? GENERIC_FAMILY;
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Fiches du bloc {{knowledge}} : « [id] Domaine — titre » suivi de lignes « - Champ : valeur ». */
export function parseKnowledge(text = '') {
  const fiches = [];
  let fiche = null;
  for (const line of String(text).split('\n')) {
    const header = line.match(/^\[([\w-]+)\] /);
    const field = line.match(/^- (.+?) : (.+)$/);
    if (header) {
      fiche = { id: header[1], fields: {} };
      fiches.push(fiche);
    } else if (fiche && field) {
      fiche.fields[field[1]] = field[2];
    }
  }
  return fiches;
}

function scenarioFromKnowledge({ id, fields }, { levelId, style, random }) {
  const organisation = `${fields.Organisation} « ${pick(ORGANISATION_NAMES, random)} »`;
  const constraints = fields['Contraintes fréquentes']
    .split(';')
    .map((constraint) => capitalize(constraint.trim()))
    .filter(Boolean);
  return {
    title: `${organisation} : ${fields.Sujet}`,
    clientName: clientNameFor(fields.Interlocuteur, random),
    clientRole: fields.Interlocuteur,
    companyName: `${organisation} (fictif)`,
    personality: { traits: style.traits, communicationStyle: style.communicationStyle, mood: style.mood },
    context: `${organisation}. ${fields['Situation actuelle']}`,
    expressedNeed: style.phrase(fields['Demande typique']),
    hiddenNeed: fields['Besoin réel'],
    implicitConstraints: constraints.sort(() => random() - 0.5).slice(0, CONSTRAINT_COUNT[levelId]),
    knowledgeSources: [id],
  };
}

export default function generateScenarioMock({ variables }, random = Math.random) {
  const domain = variables.domain ?? 'Général';
  const levelId = variables.levelId ?? LEVEL_FROM_LABEL[variables.level] ?? 'BEGINNER';
  const style = PROFILE_STYLES[variables.personalityId] ?? PROFILE_STYLES.COOPERATIVE;

  // Fiche fournie par le RAG : le scénario en découle (les fiches sont déjà triées par pertinence et diversité)
  const fiche = parseKnowledge(variables.knowledge).find(({ fields }) => KNOWLEDGE_FIELDS.every((name) => fields[name]));
  if (fiche) return scenarioFromKnowledge(fiche, { levelId, style, random });

  const family = findFamily(domain);

  // Évite de reproduire un titre déjà existant quand c'est possible
  const existing = String(variables.existingTitles ?? '');
  const fresh = family.situations.filter((situation) => !existing.includes(situation.subject));
  const situation = pick(fresh.length ? fresh : family.situations, random);

  const constraints = [...family.constraints].sort(() => random() - 0.5).slice(0, CONSTRAINT_COUNT[levelId]);

  // Domaine sans gabarit dédié : le scénario générique est rattaché au domaine demandé
  const isGeneric = family === GENERIC_FAMILY;
  const org = isGeneric ? `${situation.org} ${domain}` : situation.org;
  const context = isGeneric ? `Organisation du secteur « ${domain} ». ${situation.context}` : situation.context;

  return {
    title: `${org} : ${situation.subject}`,
    clientName: situation.clientName,
    clientRole: situation.clientRole,
    companyName: `${org} (fictif)`,
    personality: {
      traits: style.traits,
      communicationStyle: style.communicationStyle,
      mood: style.mood,
    },
    context,
    expressedNeed: style.phrase(situation.expressedNeed),
    hiddenNeed: situation.hiddenNeed,
    implicitConstraints: constraints,
    knowledgeSources: [],
  };
}
