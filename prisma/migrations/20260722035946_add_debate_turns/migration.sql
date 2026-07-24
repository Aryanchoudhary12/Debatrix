-- CreateTable
CREATE TABLE "DebateTurn" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DebateTurn_debateId_idx" ON "DebateTurn"("debateId");

-- AddForeignKey
ALTER TABLE "DebateTurn" ADD CONSTRAINT "DebateTurn_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
