import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { getScenarioSecrets } from '../../shared/db/scenarioSecrets.js';
import { clientReplySchema } from './interview.schemas.js';

// Champs renvoyés au front-end (proximity reste côté serveur)
const PUBLIC_MESSAGE_FIELDS = { id: true, sender: true, content: true, createdAt: true };

export async function listMessages(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  return prisma.interviewMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: PUBLIC_MESSAGE_FIELDS,
  });
}

/**
 * Envoie la question de l'étudiant au client simulé et enregistre l'échange.
 * Les deux messages ne sont enregistrés qu'après une réponse valide du LLM.
 */
export async function sendMessage(sessionId, user, content) {
  const session = await getAccessibleSession(sessionId, user, { requireOwner: true });
  if (session.status !== 'IN_PROGRESS') {
    throw AppError.badRequest('Cette séance est terminée');
  }

  const scenario = await getScenarioSecrets(session.scenarioId);
  const history = await prisma.interviewMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: { sender: true, content: true },
  });

  const messages = [
    ...history.map((message) => ({
      role: message.sender === 'STUDENT' ? 'user' : 'assistant',
      content: message.content,
    })),
    { role: 'user', content },
  ];

  const result = await callLLM({
    module: 'interview',
    prompt: 'client-reply',
    variables: {
      clientName: scenario.clientName,
      clientRole: scenario.clientRole,
      companyName: scenario.companyName,
      personality: scenario.personality,
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      hiddenNeed: scenario.hiddenNeed,
      implicitConstraints: scenario.implicitConstraints,
      level: scenario.level,
    },
    messages,
    schema: clientReplySchema,
    userId: user.id,
  });

  const [studentMessage, clientMessage] = await prisma.$transaction([
    prisma.interviewMessage.create({
      data: { sessionId, sender: 'STUDENT', content, proximity: result.proximity },
      select: PUBLIC_MESSAGE_FIELDS,
    }),
    prisma.interviewMessage.create({
      data: { sessionId, sender: 'CLIENT', content: result.reply },
      select: PUBLIC_MESSAGE_FIELDS,
    }),
  ]);

  return { studentMessage, clientMessage };
}
