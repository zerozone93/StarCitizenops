-- DropIndex
DROP INDEX "OrganizationMember_customRankId_idx";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrganizationCustomRank" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OrganizationCustomRankAppPrivilege" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ConversationGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "isMultiVote" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "pollOptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("pollOptionId","userId")
);

-- CreateTable
CREATE TABLE "ConversationChannelAccess" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationChannelAccess_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "ConversationReadState" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationReadState_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateIndex
CREATE INDEX "ConversationGroup_organizationId_position_idx" ON "ConversationGroup"("organizationId", "position");

-- CreateIndex
CREATE INDEX "PollVote_userId_idx" ON "PollVote"("userId");

-- CreateIndex
CREATE INDEX "ConversationChannelAccess_userId_idx" ON "ConversationChannelAccess"("userId");

-- CreateIndex
CREATE INDEX "ConversationReadState_userId_lastReadAt_idx" ON "ConversationReadState"("userId", "lastReadAt");

-- CreateIndex
CREATE INDEX "Conversation_groupId_idx" ON "Conversation"("groupId");

-- RenameForeignKey
ALTER TABLE "OrganizationCustomRankAppPrivilege" RENAME CONSTRAINT "OrganizationCustomRankAppPrivilege_organizationCustomRankId_fke" TO "OrganizationCustomRankAppPrivilege_organizationCustomRankI_fkey";

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ConversationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationGroup" ADD CONSTRAINT "ConversationGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationGroup" ADD CONSTRAINT "ConversationGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationChannelAccess" ADD CONSTRAINT "ConversationChannelAccess_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationChannelAccess" ADD CONSTRAINT "ConversationChannelAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationChannelAccess" ADD CONSTRAINT "ConversationChannelAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
