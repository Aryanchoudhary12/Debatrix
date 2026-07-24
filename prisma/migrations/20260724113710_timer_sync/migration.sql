-- AlterTable
ALTER TABLE "Debate" ADD COLUMN     "activeUserId" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "turnStartedAt" TIMESTAMP(3);
