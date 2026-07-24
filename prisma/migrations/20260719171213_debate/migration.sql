-- CreateEnum
CREATE TYPE "DebateStatus" AS ENUM ('Ongoing', 'Completed', 'Cancelled');

-- CreateTable
CREATE TABLE "Debate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "voteCountUser1" INTEGER NOT NULL DEFAULT 0,
    "voteCountUser2" INTEGER NOT NULL DEFAULT 0,
    "spectators" INTEGER NOT NULL DEFAULT 0,
    "status" "DebateStatus" NOT NULL DEFAULT 'Ongoing',
    "CurrentUserId" TEXT,
    "OpponentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Debate" ADD CONSTRAINT "Debate_CurrentUserId_fkey" FOREIGN KEY ("CurrentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debate" ADD CONSTRAINT "Debate_OpponentId_fkey" FOREIGN KEY ("OpponentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
