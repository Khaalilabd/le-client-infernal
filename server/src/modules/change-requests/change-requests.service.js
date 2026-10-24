import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { getScenarioSecrets } from '../../shared/db/scenarioSecrets.js';
import { generatedChangeRequestSchema, createResponseEvaluationSchema } from './change-requests.schemas.js';

/** Nombre maximum de demandes de changement par séance */
const MAX_CHANGE_REQUESTS = 3;

/** Liste toutes les demandes de changement d'une séance. */
export async function listChangeRequests(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  return prisma.changeRequest.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Génère une nouvelle demande de changement réaliste pour la séance.
 * v0.2 : s'appuie sur le cahier des charges existant (module 4) pour plus de réalisme.
 * Limite : MAX_CHANGE_REQUESTS demandes par séance.
 */
export async function generateChangeRequest(sessionId, user) {
  const session = await getAccessibleSession(sessionId, user, { requireOwner: true });
  if (session.status !== 'IN_PROGRESS') {
    throw AppError.badRequest('Cette séance est terminée.');
  }

  // Limite du nombre de demandes par séance
  const existingCount = await prisma.changeRequest.count({ where: { sessionId } });
  if (existingCount >= MAX_CHANGE_REQUESTS) {
    throw AppError.conflict(`Vous avez atteint la limite de ${MAX_CHANGE_REQUESTS} demandes de changement par séance.`);
  }

  const scenario = await getScenarioSecrets(session.scenarioId);

  // Liste des demandes déjà envoyées (pour ne pas répéter)
  const previous = await prisma.changeRequest.findMany({
    where: { sessionId },
    select: { title: true },
  });

  // Lecture du cahier des charges actuel (module 4) pour des demandes plus réalistes
  let currentRequirements = 'Cahier des charges non encore rédigé.';
  try {
    const reqDoc = await prisma.requirementsDocument.findUnique({
      where: { sessionId },
      include: {
        requirements: { orderBy: { position: 'asc' }, select: { type: true, code: true, title: true } },
      },
    });
    if (reqDoc && reqDoc.requirements.length > 0) {
      const TYPE_LABELS = { FUNCTIONAL: 'fonctionnelle', NON_FUNCTIONAL: 'non fonctionnelle', USER_STORY: 'user story' };
      currentRequirements = reqDoc.requirements
        .map((r) => `- [${TYPE_LABELS[r.type] ?? r.type}] ${r.code} : ${r.title}`)
        .join('\n');
    }
  } catch {
    // Si la table M4 n'est pas accessible, on continue sans erreur
    currentRequirements = 'Cahier des charges non disponible.';
  }

  const generated = await callLLM({
    module: 'change-requests',
    prompt: 'generate-change',
    variables: {
      clientName: scenario.clientName,
      personality: JSON.stringify(scenario.personality),
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      hiddenNeed: scenario.hiddenNeed,
      level: scenario.level,
      previousRequests: previous.length ? previous.map((r) => `- ${r.title}`).join('\n') : 'Aucune demande précédente.',
      currentRequirements,
      requestNumber: existingCount + 1,
      maxRequests: MAX_CHANGE_REQUESTS,
    },
    schema: generatedChangeRequestSchema,
    userId: user.id,
  });

  return prisma.changeRequest.create({ data: { ...generated, sessionId } });
}

/**
 * Enregistre la réponse de l'étudiant à une demande de changement.
 * Vérifie que la demande appartient à l'étudiant et est PENDING,
 * appelle le LLM pour évaluer la réponse, puis enregistre le résultat.
 */
export async function respondToChangeRequest(changeRequestId, user, { decision, justification }) {
  // Récupérer la demande et vérifier qu'elle appartient à l'étudiant
  const changeRequest = await prisma.changeRequest.findUnique({
    where: { id: changeRequestId },
    include: { session: true },
  });

  if (!changeRequest) {
    throw AppError.notFound('Demande de changement introuvable.');
  }

  // Vérifier que l'étudiant est propriétaire de la séance
  if (changeRequest.session.studentId !== user.id) {
    throw AppError.forbidden('Vous ne pouvez répondre qu\'aux demandes de vos propres séances.');
  }

  // Vérifier que la demande est en attente
  if (changeRequest.status !== 'PENDING') {
    throw AppError.conflict('Cette demande a déjà reçu une réponse.');
  }

  const scenario = await getScenarioSecrets(changeRequest.session.scenarioId);

  // Évaluation de la réponse par le LLM
  const evaluation = await callLLM({
    module: 'change-requests',
    prompt: 'evaluate-response',
    variables: {
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      hiddenNeed: scenario.hiddenNeed,
      personality: JSON.stringify(scenario.personality),
      clientName: scenario.clientName,
      level: scenario.level,
      changeRequestTitle: changeRequest.title,
      changeRequestDescription: changeRequest.description,
      changeRequestReason: changeRequest.reason,
      changeRequestImpact: JSON.stringify(changeRequest.impact),
      decision,
      justification,
    },
    schema: createResponseEvaluationSchema(scenario),
    userId: user.id,
  });

  // Enregistrer la décision, la justification, la note, le feedback et la réaction du client.
  // Mise à jour conditionnelle : si deux réponses arrivent en même temps, seule la première est enregistrée.
  const { count } = await prisma.changeRequest.updateMany({
    where: { id: changeRequestId, status: 'PENDING' },
    data: {
      status: 'ANSWERED',
      decision,
      justification,
      score: evaluation.score,
      feedback: evaluation.feedback,
      clientReaction: evaluation.clientReaction,
      answeredAt: new Date(),
    },
  });
  if (count === 0) {
    throw AppError.conflict('Cette demande a déjà reçu une réponse.');
  }
  const updated = await prisma.changeRequest.findUnique({ where: { id: changeRequestId } });

  return { changeRequest: updated, clientReaction: updated.clientReaction };
}
