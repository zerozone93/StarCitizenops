/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[discordUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `applicantHandle` to the `OrganizationJoinRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preferredRole` to the `OrganizationJoinRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reasonToJoin` to the `OrganizationJoinRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weeklyAvailability` to the `OrganizationJoinRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "discordBotToken" TEXT,
ADD COLUMN     "discordGuildId" TEXT,
ADD COLUMN     "discordOperationsChannelId" TEXT,
ADD COLUMN     "discordRoleSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinQuestionAvailability" TEXT NOT NULL DEFAULT 'Weekly Availability',
ADD COLUMN     "joinQuestionHandle" TEXT NOT NULL DEFAULT 'Star Citizen Username',
ADD COLUMN     "joinQuestionPreferredRole" TEXT NOT NULL DEFAULT 'Preferred Role',
ADD COLUMN     "joinQuestionReason" TEXT NOT NULL DEFAULT 'Why do you want to join?';

-- AlterTable
ALTER TABLE "OrganizationJoinRequest" ADD COLUMN     "applicantHandle" TEXT NOT NULL,
ADD COLUMN     "preferredRole" TEXT NOT NULL,
ADD COLUMN     "reasonToJoin" TEXT NOT NULL,
ADD COLUMN     "weeklyAvailability" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordUserId" TEXT,
ADD COLUMN     "discordUsername" TEXT,
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "twoFactorEmailCode" TEXT,
ADD COLUMN     "twoFactorEmailCodeExpiry" TIMESTAMP(3),
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorMethod" TEXT,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "OrganizationMemberAppPrivilege" (
    "id" TEXT NOT NULL,
    "organizationMemberId" TEXT NOT NULL,
    "editOrganization" BOOLEAN,
    "inviteMembers" BOOLEAN,
    "createOperation" BOOLEAN,
    "editOperation" BOOLEAN,
    "assignRoles" BOOLEAN,
    "inviteOrganizations" BOOLEAN,
    "viewPrivateOperations" BOOLEAN,
    "postAfterActionReports" BOOLEAN,
    "manageChannels" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMemberAppPrivilege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMemberAppPrivilege_organizationMemberId_key" ON "OrganizationMemberAppPrivilege"("organizationMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialCategory_slug_key" ON "SocialCategory"("slug");

-- CreateIndex
CREATE INDEX "SocialCategory_createdAt_idx" ON "SocialCategory"("createdAt");

-- CreateIndex
CREATE INDEX "SocialPost_categoryId_updatedAt_idx" ON "SocialPost"("categoryId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordUserId_key" ON "User"("discordUserId");

-- AddForeignKey
ALTER TABLE "OrganizationMemberAppPrivilege" ADD CONSTRAINT "OrganizationMemberAppPrivilege_organizationMemberId_fkey" FOREIGN KEY ("organizationMemberId") REFERENCES "OrganizationMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialCategory" ADD CONSTRAINT "SocialCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SocialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
