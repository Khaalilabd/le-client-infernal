import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { getScenarioSecrets } from '../../shared/db/scenarioSecrets.js';
import { QUESTION_TYPES, createClientReplySchema, interviewSummarySchema } from './interview.schemas.js';
import { loadPrompt } from '../../shared/ai/promptLoader.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const personalities = JSON.parse(readFileSync(join(__dirname, '../client-generator/data/personalities.json'), 'utf-8'));

// Champs renvoyés au front-end (proximity et questionType restent côté serveur)
const PUBLIC_MESSAGE_FIELDS = { id: true, sender: true, content: true, createdAt: true };

// Ordre chronologique ; à date égale, la question de l'étudiant passe avant la réponse du client
// (ordre de l'enum MessageSender) : les deux messages d'un échange sont créés dans la même transaction.
const MESSAGE_ORDER = [{ createdAt: 'asc' }, { sender: 'asc' }];

// Libellés des types de question, transmis au prompt de synthèse
const QUESTION_TYPE_LABELS = {
  OPEN: 'ouvertes',
  CLOSED: 'fermées',
  OFF_TOPIC: 'hors sujet',
  TECHNICAL: 'techniques',
  MANIPULATION: 'tentatives de manipulation',
};

/** Nombre de questions de chaque type (les messages antérieurs à l'analyse ne sont pas comptés). */
function countQuestionTypes(messages) {
  const counts = Object.fromEntries(QUESTION_TYPES.map((type) => [type, 0]));
  for (const { questionType } of messages) {
    if (questionType) counts[questionType] += 1;
  }
  return counts;
}

function describeQuestionTypes(counts) {
  const parts = QUESTION_TYPES.filter((type) => counts[type] > 0).map((type) => `${counts[type]} ${QUESTION_TYPE_LABELS[type]}`);
  return parts.length ? parts.join(', ') : 'non disponible';
}

// Objectif de questions selon le niveau du scénario
const RECOMMENDED_QUESTIONS = {
  BEGINNER: { min: 5, max: 8 },
  INTERMEDIATE: { min: 8, max: 12 },
  ADVANCED: { min: 10, max: 15 },
};

// Seuils pour le niveau de découverte
const DISCOVERY_THRESHOLDS = {
  MEDIUM: 0.3,
  HIGH: 0.6,
};

export async function listMessages(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  return prisma.interviewMessage.findMany({
    where: { sessionId },
    orderBy: MESSAGE_ORDER,
    select: PUBLIC_MESSAGE_FIELDS,
  });
}

/**
 * Envoie la question de l'étudiant au client simulé et enregistre l'échange.
 * Les deux messages ne sont enregistrés qu'après une réponse valide du LLM.
 * Limite l'historique envoyé au LLM : résumé du début + 20 derniers messages.
 */
export async function sendMessage(sessionId, user, content) {
  const session = await getAccessibleSession(sessionId, user, { requireOwner: true });
  if (session.status !== 'IN_PROGRESS') {
    throw AppError.badRequest('Cette séance est terminée');
  }
  await assertInterviewOpen(sessionId);

  const scenario = await getScenarioSecrets(session.scenarioId);
  const allMessages = await prisma.interviewMessage.findMany({
    where: { sessionId },
    orderBy: MESSAGE_ORDER,
    select: { sender: true, content: true },
  });

  // Limiter l'historique : si > 30 messages, envoyer les 10 premiers + les 20 derniers
  let historyToSend = allMessages;
  if (allMessages.length > 30) {
    const firstMessages = allMessages.slice(0, 10);
    const recentMessages = allMessages.slice(-20);
    historyToSend = [...firstMessages, ...recentMessages];
  }

  const messages = [
    ...historyToSend.map((message) => ({
      role: message.sender === 'STUDENT' ? 'user' : 'assistant',
      content: message.content,
    })),
    { role: 'user', content },
  ];

  // Récupère les informations de personnalité
  const personality = typeof scenario.personality === 'string' 
    ? JSON.parse(scenario.personality) 
    : scenario.personality;
  
  // Si le scénario n'a pas de profile (anciens scénarios), on le devine depuis les traits
  let personalityProfile = personality.profile;
  if (!personalityProfile && personality.traits && Array.isArray(personality.traits)) {
    const traitsLower = personality.traits.map(t => t.toLowerCase());
    if (traitsLower.some(t => t.includes('pressé') || t.includes('pressée'))) {
      personalityProfile = 'RUSHED';
    } else if (traitsLower.some(t => t.includes('méfiant') || t.includes('sceptique'))) {
      personalityProfile = 'SKEPTICAL';
    } else if (traitsLower.some(t => t.includes('bavard') || t.includes('talkative'))) {
      personalityProfile = 'TALKATIVE';
    } else if (traitsLower.some(t => t.includes('contradictoire') || t.includes('contradictory'))) {
      personalityProfile = 'CONTRADICTORY';
    } else if (traitsLower.some(t => t.includes('indécis') || t.includes('hésitant'))) {
      personalityProfile = 'INDECISIVE';
    } else {
      personalityProfile = 'COOPERATIVE'; // par défaut
    }
  }
  
  const personalityData = personalities.find((p) => p.id === personalityProfile) || personalities[0];
  const levelLabels = { BEGINNER: 'débutant', INTERMEDIATE: 'intermédiaire', ADVANCED: 'avancé' };

  const result = await callLLM({
    module: 'interview',
    prompt: 'client-reply',
    variables: {
      clientName: scenario.clientName,
      clientRole: scenario.clientRole,
      companyName: scenario.companyName,
      personality: personalityProfile || 'COOPERATIVE',
      personalityDescription: personalityData.description,
      personalityBehavior: personalityData.behavior,
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      hiddenNeed: scenario.hiddenNeed,
      implicitConstraints: Array.isArray(scenario.implicitConstraints)
        ? scenario.implicitConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')
        : scenario.implicitConstraints,
      level: scenario.level,
      levelLabel: levelLabels[scenario.level] || scenario.level,
    },
    messages,
    schema: createClientReplySchema(scenario.hiddenNeed, scenario.implicitConstraints),
    userId: user.id,
  });

  // Seul le type de question est conservé : le raisonnement (analysis) peut citer le besoin caché.
  // Dates explicites : dans une transaction, la date par défaut de PostgreSQL est la même pour les deux messages.
  const askedAt = new Date();
  const [studentMessage, clientMessage] = await prisma.$transaction([
    prisma.interviewMessage.create({
      data: { sessionId, sender: 'STUDENT', content, proximity: result.proximity, questionType: result.analysis.questionType, createdAt: askedAt },
      select: PUBLIC_MESSAGE_FIELDS,
    }),
    prisma.interviewMessage.create({
      data: { sessionId, sender: 'CLIENT', content: result.reply, createdAt: new Date(askedAt.getTime() + 1) },
      select: PUBLIC_MESSAGE_FIELDS,
    }),
  ]);

  return { studentMessage, clientMessage };
}


/** Refuse toute action si l'entretien de la séance est déjà terminé. */
async function assertInterviewOpen(sessionId) {
  const ended = await prisma.interviewSummary.findUnique({ where: { sessionId }, select: { id: true } });
  if (ended) {
    throw AppError.conflict("L'entretien est terminé : vous ne pouvez plus poser de questions au client.");
  }
}

/**
 * Termine l'entretien et génère une synthèse de ce que l'étudiant a découvert.
 * La synthèse est enregistrée dans InterviewSummary (table du module 2) ; la séance
 * reste IN_PROGRESS pour que l'étudiant enchaîne avec le cahier des charges et les
 * demandes de changement (correction P-012 : le module 2 ne modifie plus TrainingSession).
 */
export async function endInterview(sessionId, user) {
  const session = await getAccessibleSession(sessionId, user, { requireOwner: true });
  if (session.status !== 'IN_PROGRESS') {
    throw AppError.badRequest('Cette séance est terminée');
  }
  await assertInterviewOpen(sessionId);

  const scenario = await getScenarioSecrets(session.scenarioId);
  const messages = await prisma.interviewMessage.findMany({
    where: { sessionId },
    orderBy: MESSAGE_ORDER,
    select: { sender: true, content: true, questionType: true },
  });

  const studentMessages = messages.filter((msg) => msg.sender === 'STUDENT');
  const questionsCount = studentMessages.length;
  const questionTypes = describeQuestionTypes(countQuestionTypes(studentMessages));

  const historyForLLM = messages.map((message) => ({
    role: message.sender === 'STUDENT' ? 'user' : 'assistant',
    content: message.content,
  }));

  const summary = await callLLM({
    module: 'interview',
    prompt: 'summary',
    variables: {
      clientName: scenario.clientName,
      context: scenario.context,
      expressedNeed: scenario.expressedNeed,
      questionsCount,
      questionTypes,
    },
    messages: historyForLLM,
    schema: interviewSummarySchema,
    userId: user.id,
  });

  // Enregistre la fin de l'entretien (la contrainte d'unicité bloque un double envoi)
  try {
    await prisma.interviewSummary.create({ data: { sessionId, summary, questionsCount } });
  } catch (err) {
    if (err.code === 'P2002') throw AppError.conflict("L'entretien est déjà terminé.");
    throw err;
  }

  return summary;
}

/** État de l'entretien : terminé ou non, et synthèse enregistrée le cas échéant. */
export async function getSummary(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  const record = await prisma.interviewSummary.findUnique({ where: { sessionId } });
  if (!record) return { ended: false };
  return { ended: true, endedAt: record.endedAt, questionsCount: record.questionsCount, summary: record.summary };
}

/**
 * Retourne la progression de l'entretien : nombre de questions et niveau de découverte.
 */
export async function getProgress(sessionId, user) {
  const session = await getAccessibleSession(sessionId, user);
  const scenario = await prisma.scenario.findUnique({
    where: { id: session.scenarioId },
    select: { level: true },
  });

  const messages = await prisma.interviewMessage.findMany({
    where: { sessionId },
    select: { sender: true, proximity: true, questionType: true },
  });

  const studentMessages = messages.filter((msg) => msg.sender === 'STUDENT');
  const questionsCount = studentMessages.length;

  // Calcule la moyenne des proximités (seulement pour les messages STUDENT qui ont un proximity)
  const proximities = messages.filter((msg) => msg.proximity != null).map((msg) => msg.proximity);
  const avgProximity = proximities.length > 0 ? proximities.reduce((sum, p) => sum + p, 0) / proximities.length : 0;

  // Détermine le niveau de découverte selon les seuils
  let discoveryLevel = 'LOW';
  if (avgProximity >= DISCOVERY_THRESHOLDS.HIGH) {
    discoveryLevel = 'HIGH';
  } else if (avgProximity >= DISCOVERY_THRESHOLDS.MEDIUM) {
    discoveryLevel = 'MEDIUM';
  }

  const recommendedQuestions = RECOMMENDED_QUESTIONS[scenario.level] || RECOMMENDED_QUESTIONS.INTERMEDIATE;

  return {
    questionsCount,
    discoveryLevel,
    recommendedQuestions,
    questionTypes: countQuestionTypes(studentMessages),
  };
}
