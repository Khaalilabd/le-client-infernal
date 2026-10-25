// Le dashboard LIT les tables des autres modules mais n'y écrit jamais
// (sa seule table propre est TeacherFeedback).
import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { computeScoreBreakdown } from '../../shared/sessions/sessionScore.js';
import { PERSONALITY_PROFILES } from '../client-generator/client-generator.catalog.js';
import { RECOMMENDABLE_DOMAINS, recommendationSchema } from './dashboard.schemas.js';

const MIN_SESSIONS_FOR_AI = 2;
const HISTORY_FOR_AI = 10;
// Critère de la grille du module 4 qui mesure la découverte du besoin caché
const DISCOVERY_CRITERION = 'Couverture du besoin réel';

function average(values) {
  const numbers = values.filter((value) => typeof value === 'number');
  if (numbers.length === 0) return null;
  return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10;
}

const LATEST_EVALUATION = {
  evaluations: { orderBy: { createdAt: 'desc' }, take: 1, select: { globalScore: true, criteria: true } },
};

/** Part (en %) obtenue sur le critère de découverte du besoin, ou null. */
function discoveryPercent(evaluation) {
  const criterion = Array.isArray(evaluation?.criteria)
    ? evaluation.criteria.find((item) => item.name === DISCOVERY_CRITERION)
    : null;
  return criterion?.maxScore ? Math.round((criterion.score / criterion.maxScore) * 100) : null;
}

/** Statistiques personnelles, compétences et progression de l'étudiant connecté. */
export async function getStudentStats(user) {
  const sessions = await prisma.trainingSession.findMany({
    where: { studentId: user.id },
    orderBy: { startedAt: 'asc' },
    select: {
      id: true,
      status: true,
      finalScore: true,
      completedAt: true,
      scenario: { select: { title: true, level: true } },
      requirementsDocument: { select: LATEST_EVALUATION },
      _count: { select: { messages: { where: { sender: 'STUDENT' } }, changeRequests: true } },
    },
  });

  const answeredRequests = await prisma.changeRequest.findMany({
    where: { session: { studentId: user.id }, status: 'ANSWERED' },
    select: { score: true },
  });

  const evaluations = await prisma.requirementsEvaluation.findMany({
    where: { document: { session: { studentId: user.id } } },
    select: { globalScore: true },
  });

  const latestEvaluations = sessions.map((session) => session.requirementsDocument?.evaluations[0]).filter(Boolean);

  return {
    sessions: {
      total: sessions.length,
      inProgress: sessions.filter((session) => session.status === 'IN_PROGRESS').length,
      completed: sessions.filter((session) => session.status === 'COMPLETED').length,
    },
    averageFinalScore: average(sessions.map((session) => session.finalScore)),
    // Questions posées par l'étudiant (messages STUDENT)
    interviewMessages: sessions.reduce((sum, session) => sum + session._count.messages, 0),
    changeRequests: {
      total: sessions.reduce((sum, session) => sum + session._count.changeRequests, 0),
      averageScore: average(answeredRequests.map((request) => request.score)),
    },
    requirements: {
      evaluations: evaluations.length,
      averageScore: average(evaluations.map((evaluation) => evaluation.globalScore)),
    },
    // Compétences en % (null tant qu'aucune donnée n'existe)
    skills: {
      discovery: average(latestEvaluations.map(discoveryPercent)),
      requirements: average(latestEvaluations.map((evaluation) => evaluation.globalScore)),
      changes: average(answeredRequests.map((request) => request.score)),
    },
    // Notes finales des séances terminées, dans l'ordre chronologique
    progression: sessions
      .filter((session) => session.status === 'COMPLETED' && typeof session.finalScore === 'number')
      .map((session) => ({
        sessionId: session.id,
        title: session.scenario.title,
        level: session.scenario.level,
        completedAt: session.completedAt,
        finalScore: session.finalScore,
      })),
  };
}

const FEEDBACK_FIELDS = {
  orderBy: { createdAt: 'desc' },
  select: { id: true, comment: true, grade: true, createdAt: true, teacher: { select: { firstName: true, lastName: true } } },
};

/** Historique des séances de l'étudiant avec les notes de chaque étape. */
export async function getHistory(user) {
  const sessions = await prisma.trainingSession.findMany({
    where: { studentId: user.id },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      status: true,
      finalScore: true,
      startedAt: true,
      completedAt: true,
      scenario: { select: { id: true, title: true, domain: true, level: true } },
      interviewSummary: { select: { questionsCount: true } },
      changeRequests: { where: { status: 'ANSWERED' }, select: { score: true } },
      requirementsDocument: { select: LATEST_EVALUATION },
      feedbacks: FEEDBACK_FIELDS,
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    status: session.status,
    finalScore: session.finalScore,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    scenario: session.scenario,
    scores: {
      interviewQuestions: session.interviewSummary?.questionsCount ?? null,
      changeRequests: average(session.changeRequests.map((request) => request.score)),
      requirements: session.requirementsDocument?.evaluations[0]?.globalScore ?? null,
    },
    feedbacks: session.feedbacks,
  }));
}

/**
 * Historique ANONYMISÉ envoyé au LLM : domaines, niveaux et notes uniquement.
 * Aucun identifiant, nom, email ni secret du scénario (séparer la logique des données).
 */
export function buildAnonymizedHistory(sessions) {
  return sessions.map((session) => ({
    status: session.status,
    domain: session.scenario.domain,
    level: session.scenario.level,
    finalScore: session.finalScore,
    interviewQuestions: session.interviewSummary?.questionsCount ?? 0,
    changeRequestsScore: average(session.changeRequests.map((request) => request.score)),
    changeRequestsDecisions: session.changeRequests.reduce(
      (counts, request) => {
        if (request.decision) counts[request.decision] += 1;
        return counts;
      },
      { ACCEPT: 0, NEGOTIATE: 0, REFUSE: 0 },
    ),
    requirementsScore: session.requirementsDocument?.evaluations[0]?.globalScore ?? null,
    discoveryPercent: discoveryPercent(session.requirementsDocument?.evaluations[0]),
  }));
}

/** Premier domaine suggéré que l'étudiant n'a pas encore pratiqué. */
function firstUnpracticedDomain(practiced) {
  const done = new Set(practiced.map((domain) => domain.toLowerCase()));
  return RECOMMENDABLE_DOMAINS.find((domain) => !done.has(domain.toLowerCase())) ?? RECOMMENDABLE_DOMAINS[0];
}

/** Recommandation du prochain scénario par l'IA (Few-shot, historique anonymisé). */
export async function getRecommendation(user) {
  const sessions = await prisma.trainingSession.findMany({
    where: { studentId: user.id, status: { in: ['COMPLETED', 'ABANDONED'] } },
    orderBy: { completedAt: 'desc' },
    take: HISTORY_FOR_AI,
    select: {
      status: true,
      finalScore: true,
      scenario: { select: { domain: true, level: true } },
      interviewSummary: { select: { questionsCount: true } },
      changeRequests: { where: { status: 'ANSWERED' }, select: { score: true, decision: true } },
      requirementsDocument: { select: LATEST_EVALUATION },
    },
  });

  // Pas assez d'historique pour une analyse : règle simple, sans appel au LLM
  if (sessions.length < MIN_SESSIONS_FOR_AI) {
    const practiced = await prisma.trainingSession.findMany({
      where: { studentId: user.id },
      select: { scenario: { select: { domain: true } } },
    });
    return {
      weaknesses: ['Pas encore assez de séances terminées pour une analyse détaillée'],
      domain: firstUnpracticedDomain(practiced.map((session) => session.scenario.domain)),
      level: 'BEGINNER',
      personality: 'COOPERATIVE',
      focusSkill: 'Découverte du besoin caché',
      rationale: 'Terminez au moins deux séances : vous recevrez ensuite une recommandation personnalisée par l\'IA. Commencez par un client coopératif au niveau débutant.',
      source: 'RULE',
    };
  }

  const recommendation = await callLLM({
    module: 'dashboard',
    prompt: 'recommend-scenario',
    variables: {
      history: JSON.stringify(buildAnonymizedHistory(sessions), null, 2),
      domains: RECOMMENDABLE_DOMAINS.join(', '),
      personalities: PERSONALITY_PROFILES.map((profile) => `- ${profile.id} (${profile.label}) : ${profile.description}`).join('\n'),
    },
    schema: recommendationSchema,
    userId: user.id, // masquage des données personnelles par le service IA, en plus de l'anonymisation
  });

  return { ...recommendation, source: 'AI' };
}

const withPersonalityLabel = (recommendation) => ({
  ...recommendation,
  personalityLabel: PERSONALITY_PROFILES.find((profile) => profile.id === recommendation.personality)?.label ?? null,
});

/** Recommandation renvoyée au front-end, avec le libellé de la personnalité. */
export async function getRecommendationForDisplay(user) {
  return withPersonalityLabel(await getRecommendation(user));
}

/** Bilan d'une séance : notes de chaque étape, note finale (provisoire si en cours) et retours. */
export async function getSessionReport(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  const [session, breakdown] = await Promise.all([
    prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        finalScore: true,
        startedAt: true,
        completedAt: true,
        scenario: { select: { title: true, domain: true, level: true, clientName: true, companyName: true } },
        feedbacks: FEEDBACK_FIELDS,
      },
    }),
    computeScoreBreakdown(sessionId),
  ]);
  return { session, breakdown };
}

/** Vue d'ensemble pour l'enseignant. */
export async function getTeacherOverview() {
  const [studentCount, sessionCount, scenarioCount, aiCalls, scores, recentSessions, students] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.trainingSession.count(),
    prisma.scenario.count(),
    prisma.aiCallLog.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.trainingSession.findMany({ where: { finalScore: { not: null } }, select: { finalScore: true } }),
    prisma.trainingSession.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        finalScore: true,
        startedAt: true,
        student: { select: { id: true, firstName: true, lastName: true } },
        scenario: { select: { id: true, title: true, domain: true, level: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { lastName: 'asc' },
      select: { id: true, firstName: true, lastName: true, sessions: { select: { status: true, finalScore: true } } },
    }),
  ]);

  return {
    counts: { students: studentCount, sessions: sessionCount, scenarios: scenarioCount },
    averageFinalScore: average(scores.map((session) => session.finalScore)),
    aiCalls: Object.fromEntries(aiCalls.map((group) => [group.status, group._count._all])),
    recentSessions,
    students: students.map(({ sessions, ...student }) => ({
      ...student,
      sessions: sessions.length,
      completed: sessions.filter((session) => session.status === 'COMPLETED').length,
      averageFinalScore: average(sessions.map((session) => session.finalScore)),
    })),
  };
}

/** Fiche d'un étudiant (enseignant) : séances, notes de chaque étape et retours. */
export async function getStudentDetails(studentId) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: 'STUDENT' },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
  });
  if (!student) throw AppError.notFound('Étudiant introuvable');

  const sessions = await prisma.trainingSession.findMany({
    where: { studentId },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      status: true,
      finalScore: true,
      startedAt: true,
      completedAt: true,
      scenario: { select: { title: true, domain: true, level: true } },
      feedbacks: FEEDBACK_FIELDS,
    },
  });

  const withScores = await Promise.all(
    sessions.map(async (session) => ({ ...session, breakdown: await computeScoreBreakdown(session.id) })),
  );

  return {
    student,
    averageFinalScore: average(sessions.map((session) => session.finalScore)),
    sessions: withScores,
  };
}

/** Commentaire et note de l'enseignant sur une séance, visibles par l'étudiant. */
export async function addTeacherFeedback(sessionId, teacher, { comment, grade }) {
  const session = await prisma.trainingSession.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (!session) throw AppError.notFound('Séance introuvable');

  return prisma.teacherFeedback.create({
    data: { sessionId, teacherId: teacher.id, comment, grade },
    select: { id: true, comment: true, grade: true, createdAt: true, teacher: { select: { firstName: true, lastName: true } } },
  });
}
