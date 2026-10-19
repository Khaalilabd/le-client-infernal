import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { getScenarioSecrets } from '../../shared/db/scenarioSecrets.js';
import { createClientReplySchema, interviewSummarySchema } from './interview.schemas.js';
import { loadPrompt } from '../../shared/ai/promptLoader.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const personalities = JSON.parse(readFileSync(join(__dirname, '../client-generator/data/personalities.json'), 'utf-8'));

// Champs renvoyés au front-end (proximity reste côté serveur)
const PUBLIC_MESSAGE_FIELDS = { id: true, sender: true, content: true, createdAt: true };

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
    orderBy: { createdAt: 'asc' },
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

  const scenario = await getScenarioSecrets(session.scenarioId);
  const allMessages = await prisma.interviewMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
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


/**
 * Termine l'entretien et génère une synthèse de ce que l'étudiant a découvert.
 * Change le statut de la séance à COMPLETED.
 */
export async function endInterview(sessionId, user) {
  const session = await getAccessibleSession(sessionId, user, { requireOwner: true });
  if (session.status !== 'IN_PROGRESS') {
    throw AppError.badRequest('Cette séance est déjà terminée');
  }

  const scenario = await getScenarioSecrets(session.scenarioId);
  const messages = await prisma.interviewMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: { sender: true, content: true },
  });

  const studentMessages = messages.filter((msg) => msg.sender === 'STUDENT');
  const questionsCount = studentMessages.length;

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
    },
    messages: historyForLLM,
    schema: interviewSummarySchema,
    userId: user.id,
  });

  // Met à jour le statut de la séance
  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  return summary;
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
    select: { sender: true, proximity: true },
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
  };
}
