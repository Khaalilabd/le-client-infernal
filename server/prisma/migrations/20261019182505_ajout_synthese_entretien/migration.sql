-- CreateTable
CREATE TABLE "InterviewSummary" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "questionsCount" INTEGER NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSummary_sessionId_key" ON "InterviewSummary"("sessionId");

-- AddForeignKey
ALTER TABLE "InterviewSummary" ADD CONSTRAINT "InterviewSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
