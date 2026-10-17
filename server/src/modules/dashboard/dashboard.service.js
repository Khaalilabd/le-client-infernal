// Le dashboard LIT les tables des autres modules mais n'y écrit jamais
// (sa seule table propre est TeacherFeedback).
import { prisma } from '../../shared/db/prisma.js';

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
    where: { document: { session: { studentId: user.id } } },
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
