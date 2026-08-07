-- CreateTable
CREATE TABLE "RoastStats" (
    "id" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "persuasionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiFeedbackSummary" TEXT,
    "roastId" TEXT NOT NULL,

    CONSTRAINT "RoastStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoastStats_roastId_key" ON "RoastStats"("roastId");

-- AddForeignKey
ALTER TABLE "RoastStats" ADD CONSTRAINT "RoastStats_roastId_fkey" FOREIGN KEY ("roastId") REFERENCES "Roast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
