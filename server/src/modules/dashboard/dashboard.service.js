// Le dashboard LIT les tables des autres modules mais n'y écrit jamais
// (sa seule table propre est TeacherFeedback).
import { prisma } from '../../shared/db/prisma.js';
import { callLLM } from '../../shared/ai/index.js';
import { recommendationSchema } from './dashboard.schemas.js';
import { AppError } from '../../shared/errors/AppError.js';

function average(values) {
  const numbers = values.filter((value) => typeof value === 'number');
  if (numbers.length === 0) return null;
  return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10;
}

/** Statistiques personnelles de l'étudiant connecté. */
export async function getStudentStats(user) {
  const sessions = await prisma.trainingSession.findMany({
    where: { studentId: user.id },
    select: {
      status: true,
      finalScore: true,
      _count: { select: { messages: true, changeRequests: true } },
    },
  });

  const answeredRequests = await prisma.changeRequest.findMany({
    where: { session: { studentId: user.id }, status: 'ANSWERED' },
    select: { score: true },
  });

  const evaluations = await prisma.requirementsEvaluation.findMany({
    where: { requirementsDocument: { session: { studentId: user.id } } },
    select: { globalScore: true },
  });

  return {
    sessions: {
      total: sessions.length,
      inProgress: sessions.filter((session) => session.status === 'IN_PROGRESS').length,
      completed: sessions.filter((session) => session.status === 'COMPLETED').length,
    },
    averageFinalScore: average(sessions.map((session) => session.finalScore)),
    interviewMessages: sessions.reduce((sum, session) => sum + session._count.messages, 0),
    changeRequests: {
      total: sessions.reduce((sum, session) => sum + session._count.changeRequests, 0),
      averageScore: average(answeredRequests.map((request) => request.score)),
    },
    requirements: {
      evaluations: evaluations.length,
      averageScore: average(evaluations.map((evaluation) => evaluation.globalScore)),
    },
  };
}

/** Vue d'ensemble pour l'enseignant. */
export async function getTeacherOverview() {
  const [studentCount, sessionCount, scenarioCount, aiCalls, recentSessions] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.trainingSession.count(),
    prisma.scenario.count(),
    prisma.aiCallLog.groupBy({ by: ['status'], _count: { _all: true } }),
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
  ]);

  return {
    counts: { students: studentCount, sessions: sessionCount, scenarios: scenarioCount },
    aiCalls: Object.fromEntries(aiCalls.map((group) => [group.status, group._count._all])),
    recentSessions,
  };
}

// TODO (Aziz) : getHistory(user), getRecommendation(user) avec le prompt recommend-scenario,
//               addTeacherFeedback(sessionId, teacher, { comment, grade })

/** Historique des séances de l'étudiant avec notes détaillées. */
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
      scenario: {
        select: {
          id: true,
          title: true,
          domain: true,
          level: true,
        },
      },
      interviewSummary: {
        select: {
          questionsCount: true,
        },
      },
      changeRequests: {
        where: { status: 'ANSWERED' },
        select: { score: true },
      },
      requirementsDocument: {
        select: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { globalScore: true },
          },
        },
      },
      feedbacks: {
        select: {
          comment: true,
          grade: true,
          createdAt: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
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
      interview: session.interviewSummary?.questionsCount || 0,
      changeRequests: average(session.changeRequests.map((req) => req.score)),
      requirements: session.requirementsDocument?.evaluations?.[0]?.globalScore || null,
    },
    feedback: session.feedbacks.length > 0 ? session.feedbacks[0] : null,
  }));
}

/** Recommandation du prochain scénario par l'IA (historique anonymisé). */
export async function getRecommendation(user) {
  const sessions = await prisma.trainingSession.findMany({
    where: {
      studentId: user.id,
      status: { in: ['COMPLETED', 'ABANDONED'] },
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
    select: {
      status: true,
      finalScore: true,
      scenario: {
        select: {
          domain: true,
          level: true,
        },
      },
      interviewSummary: {
        select: {
          questionsCount: true,
        },
      },
      changeRequests: {
        where: { status: 'ANSWERED' },
        select: { score: true, decision: true },
      },
      requirementsDocument: {
        select: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { globalScore: true },
          },
        },
      },
    },
  });

  // Historique anonymisé : aucune donnée personnelle (nom, email)
  const anonymizedHistory = sessions.map((session) => ({
    status: session.status,
    domain: session.scenario.domain,
    level: session.scenario.level,
    finalScore: session.finalScore,
    interviewQuestions: session.interviewSummary?.questionsCount || 0,
    changeRequestsScore: average(session.changeRequests.map((req) => req.score)),
    changeRequestsDecisions: session.changeRequests.reduce(
      (acc, req) => {
        acc[req.decision] = (acc[req.decision] || 0) + 1;
        return acc;
      },
      { ACCEPT: 0, NEGOTIATE: 0, REFUSE: 0 }
    ),
    requirementsScore: session.requirementsDocument?.evaluations?.[0]?.globalScore || null,
  }));

  // Si pas assez d'historique, règle simple
  if (anonymizedHistory.length < 2) {
    return {
      weaknesses: ['Pas assez de séances pour analyse détaillée'],
      domain: 'e-commerce',
      level: 'BEGINNER',
      focusSkill: 'Recueil des besoins',
      rationale:
        'Commencez par un scénario débutant pour vous familiariser avec la plateforme.',
    };
  }

  // Appel au LLM avec historique anonymisé
  const recommendation = await callLLM({
    module: 'dashboard',
    prompt: 'recommend-scenario',
    variables: { history: JSON.stringify(anonymizedHistory, null, 2) },
    schema: recommendationSchema,
    userId: user.id, // Pour sanitize (même si l'historique est déjà anonymisé)
  });

  return recommendation;
}

/** Détails d'un étudiant (pour l'enseignant). */
export async function getStudentDetails(studentId) {
  const student = await prisma.user.findUnique({
    where: { id: studentId, role: 'STUDENT' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
    },
  });

  if (!student) {
    throw new AppError('NOT_FOUND', 'Étudiant introuvable', 404);
  }

  const sessions = await prisma.trainingSession.findMany({
    where: { studentId },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      status: true,
      finalScore: true,
      startedAt: true,
      completedAt: true,
      scenario: {
        select: {
          title: true,
          domain: true,
          level: true,
        },
      },
      feedbacks: {
        select: {
          comment: true,
          grade: true,
          createdAt: true,
        },
      },
    },
  });

  return { student, sessions };
}

/** Ajouter un commentaire et une note de l'enseignant sur une séance. */
export async function addTeacherFeedback(sessionId, teacher, { comment, grade }) {
  // Vérifier que la séance existe
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });

  if (!session) {
    throw new AppError('NOT_FOUND', 'Séance introuvable', 404);
  }

  // Créer le feedback
  const feedback = await prisma.teacherFeedback.create({
    data: {
      sessionId,
      teacherId: teacher.id,
      comment,
      grade,
    },
    include: {
      teacher: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return feedback;
}
