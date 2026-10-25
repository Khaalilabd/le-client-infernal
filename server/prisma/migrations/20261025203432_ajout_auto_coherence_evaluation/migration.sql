-- AlterTable
ALTER TABLE "ChangeRequest" ADD COLUMN     "evaluationVotes" JSONB,
ADD COLUMN     "expectedDecision" "ChangeDecision";
