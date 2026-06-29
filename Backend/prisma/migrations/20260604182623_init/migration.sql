/*
  Warnings:

  - Made the column `googleId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Analytics" ADD COLUMN     "browser" TEXT;

-- AlterTable
ALTER TABLE "Url" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "googleId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Analytics_urlId_idx" ON "Analytics"("urlId");
