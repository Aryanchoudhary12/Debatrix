-- CreateTable
CREATE TABLE "Listener" (
    "id" TEXT NOT NULL,
    "tagline" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "interests" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Listener_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stats" (
    "id" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "logicScore" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "persuasionScore" INTEGER NOT NULL DEFAULT 0,
    "factCheckAccuracy" INTEGER NOT NULL DEFAULT 0,
    "aiFeedbackSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "listenerId" TEXT NOT NULL,

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listener_userId_key" ON "Listener"("userId");

-- CreateIndex
CREATE INDEX "Listener_likes_idx" ON "Listener"("likes");

-- CreateIndex
CREATE UNIQUE INDEX "Stats_listenerId_key" ON "Stats"("listenerId");

-- CreateIndex
CREATE INDEX "Stats_elo_idx" ON "Stats"("elo");

-- CreateIndex
CREATE INDEX "Stats_overallScore_idx" ON "Stats"("overallScore");

-- AddForeignKey
ALTER TABLE "Listener" ADD CONSTRAINT "Listener_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stats" ADD CONSTRAINT "Stats_listenerId_fkey" FOREIGN KEY ("listenerId") REFERENCES "Listener"("id") ON DELETE CASCADE ON UPDATE CASCADE;
