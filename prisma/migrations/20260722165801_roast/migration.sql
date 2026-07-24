/*
  Warnings:

  - You are about to drop the column `burnScore` on the `Roast` table. All the data in the column will be lost.
  - You are about to drop the column `logicCheck` on the `Roast` table. All the data in the column will be lost.
  - You are about to drop the column `roastLevel` on the `Roast` table. All the data in the column will be lost.
  - You are about to drop the `Messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('AI', 'User');

-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_roastId_fkey";

-- AlterTable
ALTER TABLE "Roast" DROP COLUMN "burnScore",
DROP COLUMN "logicCheck",
DROP COLUMN "roastLevel";

-- DropTable
DROP TABLE "Messages";

-- DropEnum
DROP TYPE "ByWhom";

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "roastId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "roastLevel" INTEGER,
    "logicCheck" TEXT,
    "burnScore" INTEGER,
    "sender" "MessageSender" NOT NULL,
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_roastId_idx" ON "Message"("roastId");

-- CreateIndex
CREATE INDEX "Roast_userId_idx" ON "Roast"("userId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roastId_fkey" FOREIGN KEY ("roastId") REFERENCES "Roast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
