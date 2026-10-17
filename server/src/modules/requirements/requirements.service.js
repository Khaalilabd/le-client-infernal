import { prisma } from '../../shared/db/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';

const DOCUMENT_INCLUDE = {
  requirements: { orderBy: { position: 'asc' } },
  evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
};

/** Renvoie le cahier des charges de la séance (créé vide au premier accès). */
export async function getDocument(sessionId, user) {
  await getAccessibleSession(sessionId, user);
  return prisma.requirementsDocument.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
    include: DOCUMENT_INCLUDE,
  });
}

/** Remplace la liste des exigences du cahier des charges (brouillon uniquement). */
export async function saveDocument(sessionId, user, requirements) {
  await getAccessibleSession(sessionId, user, { requireOwner: true });

  const document = await prisma.requirementsDocument.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
  });
  if (document.status === 'SUBMITTED') {
    throw AppError.badRequest('Le cahier des charges a été soumis et ne peut plus être modifié');
  }

  await prisma.$transaction([
    prisma.requirement.deleteMany({ where: { documentId: document.id } }),
    prisma.requirement.createMany({
      data: requirements.map((requirement, index) => ({ ...requirement, documentId: document.id, position: index })),
    }),
    prisma.requirementsDocument.update({ where: { id: document.id }, data: { status: 'DRAFT' } }),
  ]);

  return prisma.requirementsDocument.findUnique({ where: { id: document.id }, include: DOCUMENT_INCLUDE });
}

// TODO (Nadhem) : evaluateDocument(sessionId, user)
//   -> getScenarioSecrets() pour le besoin caché et les contraintes implicites
//   -> callLLM({ module: 'requirements', prompt: 'evaluate-document', schema: documentEvaluationSchema, ... })
//   -> création d'une RequirementsEvaluation et passage du document au statut EVALUATED
