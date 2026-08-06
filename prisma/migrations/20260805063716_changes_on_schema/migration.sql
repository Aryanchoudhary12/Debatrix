/*
  Warnings:

  - You are about to drop the column `CurrentUserId` on the `Debate` table. All the data in the column will be lost.
  - You are about to drop the column `OpponentId` on the `Debate` table. All the data in the column will be lost.
  - You are about to drop the column `voteCountUser1` on the `Debate` table. All the data in the column will be lost.
  - You are about to drop the column `voteCountUser2` on the `Debate` table. All the data in the column will be lost.
  - You are about to drop the column `speakerId` on the `DebateTurn` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[debateId,turnIndex]` on the table `DebateTurn` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `participantId` to the `DebateTurn` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DebateRole" AS ENUM ('Creator', 'Opponent');

-- DropForeignKey
ALTER TABLE "Debate" DROP CONSTRAINT "Debate_CurrentUserId_fkey";

-- DropForeignKey
ALTER TABLE "Debate" DROP CONSTRAINT "Debate_OpponentId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_roastId_fkey";

-- AlterTable
ALTER TABLE "Debate" DROP COLUMN "CurrentUserId",
DROP COLUMN "OpponentId",
DROP COLUMN "voteCountUser1",
DROP COLUMN "voteCountUser2";

-- AlterTable
ALTER TABLE "DebateTurn" DROP COLUMN "speakerId",
ADD COLUMN     "participantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DebateParticipant" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DebateRole" NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "logicScore" DOUBLE PRECISION,
    "persuasionScore" DOUBLE PRECISION,
    "factCheckAccuracy" DOUBLE PRECISION,
    "feedbackSummary" TEXT,

    CONSTRAINT "DebateParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateVote" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DebateParticipant_userId_idx" ON "DebateParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateParticipant_debateId_userId_key" ON "DebateParticipant"("debateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateParticipant_debateId_role_key" ON "DebateParticipant"("debateId", "role");

-- CreateIndex
CREATE INDEX "DebateVote_participantId_idx" ON "DebateVote"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateVote_debateId_voterId_key" ON "DebateVote"("debateId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateTurn_debateId_turnIndex_key" ON "DebateTurn"("debateId", "turnIndex");

-- AddForeignKey
ALTER TABLE "DebateParticipant" ADD CONSTRAINT "DebateParticipant_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateParticipant" ADD CONSTRAINT "DebateParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTurn" ADD CONSTRAINT "DebateTurn_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "DebateParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateVote" ADD CONSTRAINT "DebateVote_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateVote" ADD CONSTRAINT "DebateVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateVote" ADD CONSTRAINT "DebateVote_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "DebateParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roastId_fkey" FOREIGN KEY ("roastId") REFERENCES "Roast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
