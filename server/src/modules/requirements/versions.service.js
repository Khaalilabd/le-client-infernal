// Versions successives du cahier des charges (décision commune M3/M4).
// Seul le module 4 écrit dans RequirementsDocumentVersion ; le module 3 lit ces versions.
// Le module 4 lit ChangeRequest pour vérifier la demande à l'origine d'une nouvelle version.
import { prisma } from '../../shared/db/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getAccessibleSession } from '../../shared/sessions/sessions.service.js';
import { snapshotSchema } from './requirements.schemas.js';
import { replaceRequirementsOps, toRequirementInput } from './requirements.service.js';

const CHANGE_REQUEST_SELECT = { id: true, title: true, decision: true };

function toVersionSummary(version, evaluations) {
  const { snapshot, ...rest } = version;
  const evaluation = evaluations.find((item) => item.version === version.version);
  return {
    ...rest,
    requirementsCount: Array.isArray(snapshot) ? snapshot.length : 0,
    globalScore: evaluation?.globalScore ?? null,
  };
}

/** Vérifie que la demande de changement autorise une nouvelle version (côté serveur, jamais d'après l'URL seule). */
async function assertChangeRequestUsable(changeRequestId, sessionId) {
  const changeRequest = await prisma.changeRequest.findUnique({
    where: { id: changeRequestId },
    select: { sessionId: true, status: true, decision: true, documentVersion: { select: { version: true } } },
  });
  if (!changeRequest || changeRequest.sessionId !== sessionId) {
    throw AppError.notFound('Demande de changement introuvable pour cette séance');
  }
  if (changeRequest.status !== 'ANSWERED' || !['ACCEPT', 'NEGOTIATE'].includes(changeRequest.decision)) {
    throw AppError.conflict('Seule une demande de changement acceptée ou négociée peut faire évoluer le cahier des charges.');
  }
  if (changeRequest.documentVersion) {
    throw AppError.conflict(`Cette demande a déjà donné lieu à la version ${changeRequest.documentVersion.version}.`);
  }
}

/**
 * Crée la version N+1 suite à une demande de changement : les exigences sont remplacées,
 * la version est figée et le document repasse au statut SUBMITTED (prêt à être réévalué).
 */
export async function createVersion(sessionId, user, { changeRequestId, reason, requirements }) {
  await getAccessibleSession(sessionId, user, { requireOwner: true });
  const document = await prisma.requirementsDocument.findUnique({
    where: { sessionId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1, select: { version: true } } },
  });
  if (!document || document.status === 'DRAFT' || document.versions.length === 0) {
    throw AppError.conflict(
      'Le cahier des charges est encore un brouillon : modifiez-le directement, puis soumettez-le.',
    );
  }
  await assertChangeRequestUsable(changeRequestId, sessionId);

  const nextVersion = document.versions[0].version + 1;
  try {
    const [, , version] = await prisma.$transaction([
      ...replaceRequirementsOps(document.id, requirements),
      prisma.requirementsDocumentVersion.create({
        data: {
          documentId: document.id,
          version: nextVersion,
          snapshot: requirements.map(toRequirementInput),
          reason,
          changeRequestId,
        },
        include: { changeRequest: { select: CHANGE_REQUEST_SELECT } },
      }),
      prisma.requirementsDocument.update({ where: { id: document.id }, data: { status: 'SUBMITTED' } }),
    ]);
    return version;
  } catch (err) {
    // Double clic ou deux onglets : la contrainte d'unicité a refusé la seconde version.
    if (err.code === 'P2002') throw AppError.conflict('Une version vient déjà d\'être créée : rechargez la page.');
    throw err;
  }
}

/** Liste des versions (sans le contenu), filtrable par demande de changement pour le module 3. */
export async function listVersions(sessionId, user, { changeRequestId } = {}) {
  await getAccessibleSession(sessionId, user);
  const document = await prisma.requirementsDocument.findUnique({ where: { sessionId }, select: { id: true } });
  if (!document) return [];

  const [versions, evaluations] = await Promise.all([
    prisma.requirementsDocumentVersion.findMany({
      where: { documentId: document.id, ...(changeRequestId ? { changeRequestId } : {}) },
      orderBy: { version: 'desc' },
      include: { changeRequest: { select: CHANGE_REQUEST_SELECT } },
    }),
    prisma.requirementsEvaluation.findMany({
      where: { documentId: document.id },
      orderBy: { createdAt: 'desc' },
      select: { version: true, globalScore: true },
    }),
  ]);
  return versions.map((version) => toVersionSummary(version, evaluations));
}

/** Une version avec son contenu figé (validé par Zod avant d'être renvoyé). */
export async function getVersion(sessionId, user, versionNumber) {
  await getAccessibleSession(sessionId, user);
  const version = await prisma.requirementsDocumentVersion.findFirst({
    where: { version: versionNumber, document: { sessionId } },
    include: { changeRequest: { select: CHANGE_REQUEST_SELECT } },
  });
  if (!version) throw AppError.notFound(`Version ${versionNumber} introuvable`);

  const snapshot = snapshotSchema.safeParse(version.snapshot);
  if (!snapshot.success) {
    throw new AppError(500, 'INTERNAL_ERROR', `Le contenu de la version ${versionNumber} est illisible.`);
  }
  return { ...version, snapshot: snapshot.data };
}
