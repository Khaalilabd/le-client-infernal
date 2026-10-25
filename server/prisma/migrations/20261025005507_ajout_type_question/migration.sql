-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('OPEN', 'CLOSED', 'OFF_TOPIC', 'TECHNICAL', 'MANIPULATION');

-- AlterTable
ALTER TABLE "InterviewMessage" ADD COLUMN     "questionType" "QuestionType";
