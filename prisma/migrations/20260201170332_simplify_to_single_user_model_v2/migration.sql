/*
  Warnings:

  - You are about to drop the column `childId` on the `letter_progress` table. All the data in the column will be lost.
  - You are about to drop the column `childId` on the `mission_states` table. All the data in the column will be lost.
  - You are about to drop the column `childId` on the `progress` table. All the data in the column will be lost.
  - You are about to drop the column `childId` on the `quiz_attempts` table. All the data in the column will be lost.
  - You are about to drop the `child_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `level_states` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parent_accounts` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,letterId]` on the table `letter_progress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,periodType,missionKey,periodStartDate]` on the table `mission_states` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,wordId]` on the table `progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `letter_progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `mission_states` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `quiz_attempts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "child_profiles" DROP CONSTRAINT "child_profiles_parentAccountId_fkey";

-- DropForeignKey
ALTER TABLE "letter_progress" DROP CONSTRAINT "letter_progress_childId_fkey";

-- DropForeignKey
ALTER TABLE "level_states" DROP CONSTRAINT "level_states_childId_fkey";

-- DropForeignKey
ALTER TABLE "mission_states" DROP CONSTRAINT "mission_states_childId_fkey";

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_childId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_childId_fkey";

-- DropIndex
DROP INDEX "letter_progress_childId_letterId_key";

-- DropIndex
DROP INDEX "mission_states_childId_periodType_missionKey_periodStartDat_key";

-- DropIndex
DROP INDEX "progress_childId_wordId_key";

-- AlterTable
ALTER TABLE "letter_progress" DROP COLUMN "childId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mission_states" DROP COLUMN "childId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "progress" DROP COLUMN "childId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quiz_attempts" DROP COLUMN "childId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "child_profiles";

-- DropTable
DROP TABLE "level_states";

-- DropTable
DROP TABLE "parent_accounts";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "googleId" TEXT,
    "name" TEXT,
    "image" TEXT,
    "avatar" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "deviceId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "settingsJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_deviceId_key" ON "users"("deviceId");

-- CreateIndex
CREATE INDEX "users_deviceId_idx" ON "users"("deviceId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "letter_progress_userId_letterId_key" ON "letter_progress"("userId", "letterId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_states_userId_periodType_missionKey_periodStartDate_key" ON "mission_states"("userId", "periodType", "missionKey", "periodStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_wordId_key" ON "progress"("userId", "wordId");

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_states" ADD CONSTRAINT "mission_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_progress" ADD CONSTRAINT "letter_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
