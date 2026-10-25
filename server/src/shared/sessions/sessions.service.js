// Séances d'entraînement (TrainingSession) : point de jonction entre les modules.
// Les modules 2, 3 et 4 utilisent getAccessibleSession() pour vérifier les droits.
import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';
import { toPublicScenario } from '../serializers/scenario.js';
import { computeScoreBreakdown } from './sessionScore.js';

function toPublicSession(session) {
  return session.scenario ? { ...session, scenario: toPublicScenario(session.scenario) } : session;
}

/**
 * Renvoie la séance si l'utilisateur y a accès (étudiant propriétaire ou enseignant).
 * @param {string} sessionId
 * @param {{ id: string, role: string }} user
 * @param {{ requireOwner?: boolean }} options requireOwner : seul l'étudiant propriétaire (ex. envoyer un message)
 */
export async function getAccessibleSession(sessionId, user, { requireOwner = false } = {}) {
  const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  if (!session) throw AppError.notFound('Séance introuvable');

  const isOwner = session.studentId === user.id;
  const isTeacher = user.role === 'TEACHER';
  if (!isOwner && (requireOwner || !isTeacher)) {
    throw AppError.forbidden("Cette séance ne vous appartient pas");
  }
  return session;
}

export async function createSession(user, scenarioId) {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) throw AppError.notFound('Scénario introuvable');

  const session = await prisma.trainingSession.create({
    data: { studentId: user.id, scenarioId },
    include: { scenario: true },
  });
  return toPublicSession(session);
}

export async function listSessions(user) {
  const sessions = await prisma.trainingSession.findMany({
    where: user.role === 'TEACHER' ? {} : { studentId: user.id },
    include: { scenario: true },
    orderBy: { startedAt: 'desc' },
  });
  return sessions.map(toPublicSession);
}

export async function getSession(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { scenario: true },
  });
  return toPublicSession(session);
}

/**
 * Termine (COMPLETED) ou abandonne (ABANDONED) une séance en cours.
 * Terminer calcule la note finale (sessionScore.js) et exige un cahier des charges évalué.
 */
export async function updateStatus(sessionId, user, status) {
  const current = await getAccessibleSession(sessionId, user, { requireOwner: true });
  if (current.status !== 'IN_PROGRESS') {
    throw AppError.conflict('Cette séance est déjà terminée.');
  }

  let finalScore = null;
  if (status === 'COMPLETED') {
    const breakdown = await computeScoreBreakdown(sessionId);
    if (breakdown.components.requirements === null) {
      throw new AppError(
        409,
        'REQUIREMENTS_NOT_EVALUATED',
        'Faites évaluer votre cahier des charges avant de terminer la séance.',
      );
    }
    finalScore = breakdown.finalScore;
  }

  const session = await prisma.trainingSession.update({
    where: { id: sessionId },
    data: { status, finalScore, completedAt: new Date() },
    include: { scenario: true },
  });
  return toPublicSession(session);
}
