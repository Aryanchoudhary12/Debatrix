/*
  Warnings:

  - The values [Ongoing] on the enum `DebateStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DebateStatus_new" AS ENUM ('Waiting', 'Live', 'Completed', 'Cancelled');
ALTER TABLE "public"."Debate" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Debate" ALTER COLUMN "status" TYPE "DebateStatus_new" USING ("status"::text::"DebateStatus_new");
ALTER TYPE "DebateStatus" RENAME TO "DebateStatus_old";
ALTER TYPE "DebateStatus_new" RENAME TO "DebateStatus";
DROP TYPE "public"."DebateStatus_old";
ALTER TABLE "Debate" ALTER COLUMN "status" SET DEFAULT 'Waiting';
COMMIT;

-- AlterTable
ALTER TABLE "Debate" ALTER COLUMN "status" SET DEFAULT 'Waiting';
