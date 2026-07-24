-- CreateEnum
CREATE TYPE "ByWhom" AS ENUM ('AI', 'User');

-- CreateTable
CREATE TABLE "Roast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roastLevel" INTEGER NOT NULL,
    "logicCheck" TEXT NOT NULL,
    "burnScore" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" TEXT NOT NULL,
    "roastId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "byWhom" "ByWhom" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Roast" ADD CONSTRAINT "Roast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_roastId_fkey" FOREIGN KEY ("roastId") REFERENCES "Roast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
