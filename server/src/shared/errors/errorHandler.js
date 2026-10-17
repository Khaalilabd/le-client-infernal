// Gestion centralisée des erreurs. Format de réponse unique :
// { error: { code, message, details? } }
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from './AppError.js';
import { AiError } from '../ai/errors.js';
import { env } from '../../config/env.js';

function toAppError(err) {
  if (err instanceof AppError) return err;

  if (err instanceof AiError) {
    return new AppError(err.status, err.code, err.message);
  }

  if (err instanceof ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Données invalides', formatZodIssues(err));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return AppError.conflict('Cette ressource existe déjà');
    if (err.code === 'P2025') return AppError.notFound();
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(503, 'DATABASE_UNAVAILABLE', 'Base de données inaccessible. Lancez `npm run db:up`.');
  }

  if (err?.type === 'entity.parse.failed') {
    return AppError.badRequest('Corps de requête JSON invalide');
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Erreur interne du serveur');
}

export function formatZodIssues(zodError) {
  return zodError.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const appError = toAppError(err);

  if (appError.status >= 500 && env.NODE_ENV !== 'test') {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body = { error: { code: appError.code, message: appError.message } };
  if (appError.details) body.error.details = appError.details;

  res.status(appError.status).json(body);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `Route inconnue : ${req.method} ${req.originalUrl}` },
  });
}
