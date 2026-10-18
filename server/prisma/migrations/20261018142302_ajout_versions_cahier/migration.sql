-- AlterTable
ALTER TABLE "RequirementsEvaluation" ADD COLUMN     "version" INTEGER;

-- CreateTable
CREATE TABLE "RequirementsDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "changeRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementsDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequirementsDocumentVersion_changeRequestId_key" ON "RequirementsDocumentVersion"("changeRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementsDocumentVersion_documentId_version_key" ON "RequirementsDocumentVersion"("documentId", "version");

-- AddForeignKey
ALTER TABLE "RequirementsDocumentVersion" ADD CONSTRAINT "RequirementsDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "RequirementsDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementsDocumentVersion" ADD CONSTRAINT "RequirementsDocumentVersion_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
