import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { getScenarioSecrets } from '../../shared/db/scenarioSecrets.js';
import { generatedChangeRequestSchema } from './change-requests.schemas.js';

export async function listChangeRequests(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  return prisma.changeRequest.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

/** Génère une nouvelle demande de changement réaliste pour la séance. */
export async function generateChangeRequest(sessionId, user) {
  const session = await getAccessibleSession(sessionId, user, { requireOwner: true });
  if (session.status !== 'IN_PROGRESS') {
    throw AppError.badRequest('Cette séance est terminée');
  }

  const scenario = await getScenarioSecrets(session.scenarioId);
  const previous = await prisma.changeRequest.findMany({
    where: { sessionId },
    select: { title: true },
  });

  const generated = await callLLM({
    module: 'change-requests',
    prompt: 'generate-change',
    variables: {
      clientName: scenario.clientName,
      personality: scenario.personality,
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      hiddenNeed: scenario.hiddenNeed,
      level: scenario.level,
      previousRequests: previous.length ? previous.map((request) => request.title) : 'aucune',
    },
    schema: generatedChangeRequestSchema,
    userId: user.id,
  });

  return prisma.changeRequest.create({ data: { ...generated, sessionId } });
}

// TODO (Ismail) : respondToChangeRequest(changeRequestId, user, { decision, justification })
//   -> callLLM({ module: 'change-requests', prompt: 'evaluate-response', schema: responseEvaluationSchema, ... })
//   -> mise à jour de ChangeRequest (status ANSWERED, decision, justification, score, feedback, answeredAt)
