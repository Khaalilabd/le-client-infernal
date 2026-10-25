// Cahier des charges : édition, soumission et évaluation par le LLM.
// Cycle de vie : DRAFT --submit--> SUBMITTED (V1) --evaluate--> EVALUATED
//                puis POST /versions (demande de changement acceptée ou négociée) --> SUBMITTED (V N+1)
import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { getScenarioSecrets } from '../../shared/db/scenarioSecrets.js';
import { createDocumentEvaluationSchema, normalizeEvaluation } from './requirements.schemas.js';
import { gridToText } from './requirements.grid.js';
import {
  buildReferencePoints,
  createMatchingSchema,
  summarizeMatching,
  matchingToText,
  applyMatching,
} from './requirements.matching.js';

const MODULE = 'requirements';

const DOCUMENT_INCLUDE = {
  requirements: { orderBy: { position: 'asc' } },
  evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
  versions: { orderBy: { version: 'desc' }, take: 1, select: { version: true } },
};

const LEVEL_LABELS = { BEGINNER: 'débutant', INTERMEDIATE: 'intermédiaire', ADVANCED: 'avancé' };

/** Exigence telle qu'elle est saisie (sans identifiants techniques) : format des snapshots et du prompt. */
export function toRequirementInput({ type, code, title, description, priority, acceptanceCriteria }) {
  return { type, code, title, description, priority, ...(acceptanceCriteria?.length ? { acceptanceCriteria } : {}) };
}

/** Version envoyée au front-end : la dernière évaluation et le numéro de la version courante. */
function toPublicDocument(document) {
  const { versions, ...rest } = document;
  return { ...rest, currentVersion: versions[0]?.version ?? null };
}

function getOrCreateDocument(sessionId, include) {
  return prisma.requirementsDocument.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
    ...(include ? { include } : {}),
  });
}

async function loadPublicDocument(documentId) {
  const document = await prisma.requirementsDocument.findUnique({ where: { id: documentId }, include: DOCUMENT_INCLUDE });
  return toPublicDocument(document);
}

/** Remplace les exigences du document (à appeler dans une transaction). */
export function replaceRequirementsOps(documentId, requirements) {
  return [
    prisma.requirement.deleteMany({ where: { documentId } }),
    prisma.requirement.createMany({
      data: requirements.map((requirement, index) => ({ ...toRequirementInput(requirement), documentId, position: index })),
    }),
  ];
}

/** Renvoie le cahier des charges de la séance (créé vide au premier accès). */
export async function getDocument(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  return toPublicDocument(await getOrCreateDocument(sessionId, DOCUMENT_INCLUDE));
}

/** Remplace la liste des exigences (brouillon uniquement). */
export async function saveDocument(sessionId, user, requirements) {
  await getAccessibleSession(sessionId, user, { requireOwner: true });
  const document = await getOrCreateDocument(sessionId);
  if (document.status !== 'DRAFT') {
    throw AppError.conflict(
      'Le cahier des charges a été soumis : il ne peut évoluer que par une nouvelle version, après une demande de changement acceptée ou négociée.',
    );
  }

  await prisma.$transaction(replaceRequirementsOps(document.id, requirements));
  return loadPublicDocument(document.id);
}

/** Soumet le brouillon : crée la version 1 et verrouille le document. */
export async function submitDocument(sessionId, user) {
  await getAccessibleSession(sessionId, user, { requireOwner: true });
  const document = await getOrCreateDocument(sessionId, { requirements: { orderBy: { position: 'asc' } } });
  if (document.status !== 'DRAFT') {
    throw AppError.conflict('Le cahier des charges a déjà été soumis.');
  }
  if (document.requirements.length === 0) {
    throw AppError.badRequest('Ajoutez au moins une exigence avant de soumettre le cahier des charges.');
  }

  await prisma.$transaction([
    prisma.requirementsDocumentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        snapshot: document.requirements.map(toRequirementInput),
        reason: 'Première soumission du cahier des charges',
      },
    }),
    prisma.requirementsDocument.update({ where: { id: document.id }, data: { status: 'SUBMITTED' } }),
  ]);
  return loadPublicDocument(document.id);
}

/** Demandes de changement acceptées ou négociées qui ont produit une version : elles modifient le périmètre attendu. */
async function describeAcceptedChanges(documentId) {
  const versions = await prisma.requirementsDocumentVersion.findMany({
    where: { documentId, changeRequestId: { not: null } },
    orderBy: { version: 'asc' },
    select: { version: true, changeRequest: { select: { title: true, description: true, decision: true } } },
  });
  const accepted = versions.filter((version) => version.changeRequest);
  if (accepted.length === 0) return 'Aucune.';
  return accepted
    .map(
      ({ version, changeRequest }) =>
        `- Version ${version} (${changeRequest.decision === 'ACCEPT' ? 'acceptée' : 'négociée'}) : ${changeRequest.title}. ${changeRequest.description}`,
    )
    .join('\n');
}

/**
 * Évalue la version courante du cahier des charges avec le LLM, en la comparant au besoin caché, en deux appels :
 * 1. match-requirements : chaque point du besoin caché et chaque contrainte implicite est mis en
 *    correspondance avec les exigences (identifiants et codes uniquement) ;
 * 2. evaluate-document : notation selon la grille, en tenant compte de ce matching.
 * Les notes de couverture et de contraintes sont ensuite calculées par le serveur à partir du matching.
 * Le besoin caché est lu côté serveur et n'apparaît jamais dans la réponse.
 */
export async function evaluateDocument(sessionId, user) {
  const session = await getAccessibleSession(sessionId, user, { requireOwner: true });
  const document = await prisma.requirementsDocument.findUnique({
    where: { sessionId },
    include: { ...DOCUMENT_INCLUDE, evaluations: false },
  });
  if (!document || document.status === 'DRAFT') {
    throw AppError.conflict('Soumettez le cahier des charges avant de demander une évaluation.');
  }
  if (document.status === 'EVALUATED') {
    throw AppError.conflict(
      'Cette version a déjà été évaluée. Une nouvelle évaluation sera possible après une nouvelle version du cahier des charges.',
    );
  }

  const version = document.versions[0]?.version ?? 1;
  const scenario = await getScenarioSecrets(session.scenarioId);
  const requirements = document.requirements.map(toRequirementInput);
  const codes = requirements.map((requirement) => requirement.code);
  const acceptedChanges = await describeAcceptedChanges(document.id);
  const level = LEVEL_LABELS[scenario.level] ?? scenario.level;

  const points = buildReferencePoints(scenario);
  const matching = await callLLM({
    module: MODULE,
    prompt: 'match-requirements',
    variables: {
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      level,
      referencePoints: points,
      acceptedChanges,
      requirements,
    },
    schema: createMatchingSchema(points, codes),
    userId: user.id,
  });
  const summary = summarizeMatching(points, matching, codes);

  const raw = await callLLM({
    module: MODULE,
    prompt: 'evaluate-document',
    variables: {
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      hiddenNeed: scenario.hiddenNeed,
      implicitConstraints: scenario.implicitConstraints,
      level,
      grid: gridToText(),
      version: String(version),
      acceptedChanges,
      matching: matchingToText(points, summary),
      requirements,
    },
    schema: createDocumentEvaluationSchema(scenario),
    userId: user.id,
  });
  const evaluation = applyMatching(normalizeEvaluation(raw), summary);

  // Le passage SUBMITTED -> EVALUATED est conditionnel : deux évaluations simultanées ne peuvent pas aboutir toutes les deux.
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.requirementsDocument.updateMany({
      where: { id: document.id, status: 'SUBMITTED' },
      data: { status: 'EVALUATED' },
    });
    if (count === 0) throw AppError.conflict('Le cahier des charges a changé pendant l\'évaluation : réessayez.');
    return tx.requirementsEvaluation.create({
      data: {
        documentId: document.id,
        version,
        globalScore: evaluation.globalScore,
        criteria: evaluation.criteria,
        feedback: evaluation.feedback,
        missingPoints: evaluation.missingPoints,
      },
    });
  });
}

/** Historique des évaluations, de la plus récente à la plus ancienne. */
export async function listEvaluations(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  const document = await prisma.requirementsDocument.findUnique({ where: { sessionId }, select: { id: true } });
  if (!document) return [];
  return prisma.requirementsEvaluation.findMany({ where: { documentId: document.id }, orderBy: { createdAt: 'desc' } });
}
