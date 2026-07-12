-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('SITE_ADMIN', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "OrganizationFocusType" AS ENUM ('MILITARY', 'LOGISTICS', 'MINING', 'SALVAGE', 'PIRACY', 'SECURITY', 'EXPLORATION', 'TRADE', 'MEDICAL', 'RACING', 'MIXED');

-- CreateEnum
CREATE TYPE "OrganizationVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'OFFICER', 'COMMANDER', 'TEAM_LEADER', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('FLEET_PATROL', 'GROUND_ASSAULT', 'BOUNTY_OPERATION', 'CARGO_CONVOY', 'MINING_SECURITY', 'SALVAGE_OPERATION', 'RESCUE_OPERATION', 'MEDICAL_SUPPORT_OPERATION', 'EXPLORATION_MISSION', 'BASE_DEFENSE', 'JOINT_FLEET_EXERCISE', 'COMBINED_ARMS_ASSAULT', 'PIRACY_INTERDICTION', 'ANTI_PIRACY_ESCORT', 'CUSTOM_OPERATION');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('DRAFT', 'PLANNED', 'BRIEFING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ThreatLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('GOING', 'MAYBE', 'DECLINED', 'STANDBY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORG_INVITE', 'OP_ASSIGNMENT', 'OP_UPDATE', 'COMMENT_MENTION', 'COALITION_INVITE', 'AI_PLAN_GENERATED', 'MISSION_INTELLIGENCE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OrganizationInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrganizationJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExternalUpdateSourceType" AS ENUM ('RSI_COMM_LINK', 'RSI_PATCH_NOTES', 'RSI_DEV_TRACKER', 'WIKI', 'COMMUNITY', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExternalUpdateItemStatus" AS ENUM ('NEW', 'PROCESSED', 'IGNORED', 'ERROR');

-- CreateEnum
CREATE TYPE "MissionSuggestionReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_EDIT', 'MERGED');

-- CreateEnum
CREATE TYPE "MissionIntelligenceRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('FLEET_SHIP', 'FIGHTER', 'DROPSHIP', 'CARGO_SHIP', 'MEDICAL_SHIP', 'SALVAGE_SHIP', 'MINING_SHIP', 'GROUND_VEHICLE', 'SUPPORT_VEHICLE', 'INFANTRY_SQUAD', 'LOGISTICS_PACKAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "MissionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXTREME');

-- CreateEnum
CREATE TYPE "MissionRewardType" AS ENUM ('aUEC', 'REPUTATION', 'LOOT', 'RESOURCES', 'TRAINING', 'RECRUITMENT', 'DIPLOMACY', 'ROLEPLAY', 'ORG_READINESS', 'FUN_SOCIAL');

-- CreateEnum
CREATE TYPE "ShipRole" AS ENUM ('FIGHTER', 'HEAVY_FIGHTER', 'BOMBER', 'INTERCEPTOR', 'GUNSHIP', 'CORVETTE', 'CAPITAL', 'CARGO', 'MEDICAL', 'REFUEL', 'REPAIR', 'SALVAGE', 'MINING', 'EXPLORATION', 'SCOUT', 'DROPSHIP', 'TRANSPORT', 'RACING', 'SUPPORT', 'MULTI_ROLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ShipSize" AS ENUM ('SNUB', 'SMALL', 'MEDIUM', 'LARGE', 'CAPITAL');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'LOANER', 'IN_GAME_RENTAL', 'IN_GAME_PURCHASED', 'PLEDGED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "VehicleRole" AS ENUM ('COMBAT', 'TRANSPORT', 'MINING', 'EXPLORATION', 'RACING', 'SUPPORT', 'CARGO', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "starCitizenHandle" TEXT,
    "bio" TEXT,
    "timezone" TEXT,
    "availability" TEXT,
    "preferredRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "siteRole" "SiteRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT,
    "focusType" "OrganizationFocusType" NOT NULL DEFAULT 'MIXED',
    "visibility" "OrganizationVisibility" NOT NULL DEFAULT 'PUBLIC',
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "title" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "email" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "message" TEXT,
    "status" "OrganizationInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationJoinRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "OrganizationJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllianceMember" (
    "id" TEXT NOT NULL,
    "allianceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllianceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coalition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "operationId" TEXT,
    "createdById" TEXT NOT NULL,
    "commandNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coalition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoalitionMember" (
    "id" TEXT NOT NULL,
    "coalitionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responsibility" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoalitionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "OperationType" NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "location" TEXT,
    "threatLevel" "ThreatLevel" NOT NULL DEFAULT 'MODERATE',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "status" "OperationStatus" NOT NULL DEFAULT 'PLANNED',
    "visibility" "OrganizationVisibility" NOT NULL DEFAULT 'PUBLIC',
    "commanderId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "coalitionId" TEXT,
    "missionTemplateId" TEXT,
    "missionBrief" TEXT,
    "commsPlan" TEXT,
    "rulesOfEngagement" TEXT,
    "rallyPoints" TEXT,
    "extractionPlan" TEXT,
    "contingencyPlans" TEXT,
    "requiredSupplies" TEXT,
    "requiredShips" TEXT,
    "requiredGroundVehicles" TEXT,
    "requiredPersonnel" TEXT,
    "missionPhases" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationParticipant" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "assignedRole" TEXT,
    "team" TEXT,
    "status" "RSVPStatus" NOT NULL DEFAULT 'STANDBY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationAsset" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "ownerOrganizationId" TEXT,
    "assetType" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "role" TEXT,
    "size" TEXT,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT 'Unknown',
    "role" "ShipRole" NOT NULL DEFAULT 'OTHER',
    "size" "ShipSize" NOT NULL DEFAULT 'SMALL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroundVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT 'Unknown',
    "role" "VehicleRole" NOT NULL DEFAULT 'OTHER',
    "size" "VehicleSize" NOT NULL DEFAULT 'SMALL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroundVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "team" TEXT,
    "notes" TEXT,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageId","userId","emoji")
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("commentId","userId","emoji")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGeneratedPlan" (
    "id" TEXT NOT NULL,
    "operationId" TEXT,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIGeneratedPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AfterActionReport" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "summary" TEXT,
    "whatWentWell" TEXT,
    "whatWentWrong" TEXT,
    "lessonsLearned" TEXT,
    "casualtiesOrLosses" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfterActionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RSVP" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'MAYBE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFeedItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "operationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionTemplate" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "difficulty" "MissionDifficulty" NOT NULL,
    "estimatedDuration" TEXT,
    "recommendedPlayersMin" INTEGER NOT NULL DEFAULT 1,
    "recommendedPlayersMax" INTEGER NOT NULL DEFAULT 50,
    "recommendedOrganizationsMin" INTEGER NOT NULL DEFAULT 1,
    "recommendedOrganizationsMax" INTEGER NOT NULL DEFAULT 5,
    "requiredRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optionalRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredAssets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optionalAssets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preparationChecklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "executionSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "successConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rewardTypes" "MissionRewardType"[] DEFAULT ARRAY[]::"MissionRewardType"[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiPromptSeed" TEXT,
    "sourceType" TEXT,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "sourcePublishedAt" TIMESTAMP(3),
    "addedByMissionIntelligence" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalUpdateSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceType" "ExternalUpdateSourceType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "checkFrequencyDays" INTEGER NOT NULL DEFAULT 6,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessfulCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalUpdateSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalUpdateItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "url" TEXT,
    "title" TEXT,
    "summary" TEXT,
    "rawContent" TEXT,
    "publishedAt" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT,
    "status" "ExternalUpdateItemStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalUpdateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionSuggestion" (
    "id" TEXT NOT NULL,
    "externalUpdateItemId" TEXT,
    "suggestedCategoryName" TEXT,
    "suggestedTemplateName" TEXT,
    "suggestedSummary" TEXT,
    "suggestedDescription" TEXT,
    "suggestedDifficulty" TEXT,
    "suggestedDuration" TEXT,
    "suggestedPlayersMin" INTEGER,
    "suggestedPlayersMax" INTEGER,
    "suggestedOrganizationsMin" INTEGER,
    "suggestedOrganizationsMax" INTEGER,
    "suggestedRequiredRoles" TEXT[],
    "suggestedOptionalRoles" TEXT[],
    "suggestedRequiredAssets" JSONB NOT NULL DEFAULT '[]',
    "suggestedOptionalAssets" JSONB NOT NULL DEFAULT '[]',
    "suggestedObjectives" TEXT[],
    "suggestedPreparationChecklist" TEXT[],
    "suggestedExecutionSteps" TEXT[],
    "suggestedSuccessConditions" TEXT[],
    "suggestedFailureConditions" TEXT[],
    "suggestedRisks" TEXT[],
    "suggestedRewardTypes" TEXT[],
    "suggestedTags" TEXT[],
    "suggestedAiPromptSeed" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "reviewStatus" "MissionSuggestionReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdMissionTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionIntelligenceRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "MissionIntelligenceRunStatus" NOT NULL DEFAULT 'RUNNING',
    "sourcesChecked" INTEGER NOT NULL DEFAULT 0,
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "newItemsCreated" INTEGER NOT NULL DEFAULT 0,
    "suggestionsCreated" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionIntelligenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_tag_key" ON "Organization"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInvite_organizationId_status_idx" ON "OrganizationInvite"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrganizationInvite_email_status_idx" ON "OrganizationInvite"("email", "status");

-- CreateIndex
CREATE INDEX "OrganizationInvite_invitedUserId_status_idx" ON "OrganizationInvite"("invitedUserId", "status");

-- CreateIndex
CREATE INDEX "OrganizationJoinRequest_organizationId_status_idx" ON "OrganizationJoinRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrganizationJoinRequest_userId_status_idx" ON "OrganizationJoinRequest"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AllianceMember_allianceId_organizationId_key" ON "AllianceMember"("allianceId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CoalitionMember_coalitionId_organizationId_key" ON "CoalitionMember"("coalitionId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationParticipant_operationId_userId_key" ON "OperationParticipant"("operationId", "userId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE INDEX "Conversation_organizationId_updatedAt_idx" ON "Conversation"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "MessageReaction"("userId");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "CommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RSVP_operationId_userId_key" ON "RSVP"("operationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionCategory_name_key" ON "MissionCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MissionCategory_slug_key" ON "MissionCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MissionTemplate_categoryId_slug_key" ON "MissionTemplate"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalUpdateItem_sourceId_externalId_key" ON "ExternalUpdateItem"("sourceId", "externalId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationJoinRequest" ADD CONSTRAINT "OrganizationJoinRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationJoinRequest" ADD CONSTRAINT "OrganizationJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationJoinRequest" ADD CONSTRAINT "OrganizationJoinRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllianceMember" ADD CONSTRAINT "AllianceMember_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "Alliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllianceMember" ADD CONSTRAINT "AllianceMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coalition" ADD CONSTRAINT "Coalition_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coalition" ADD CONSTRAINT "Coalition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoalitionMember" ADD CONSTRAINT "CoalitionMember_coalitionId_fkey" FOREIGN KEY ("coalitionId") REFERENCES "Coalition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoalitionMember" ADD CONSTRAINT "CoalitionMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_coalitionId_fkey" FOREIGN KEY ("coalitionId") REFERENCES "Coalition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_missionTemplateId_fkey" FOREIGN KEY ("missionTemplateId") REFERENCES "MissionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationParticipant" ADD CONSTRAINT "OperationParticipant_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationParticipant" ADD CONSTRAINT "OperationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationParticipant" ADD CONSTRAINT "OperationParticipant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAsset" ADD CONSTRAINT "OperationAsset_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAsset" ADD CONSTRAINT "OperationAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAsset" ADD CONSTRAINT "OperationAsset_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroundVehicle" ADD CONSTRAINT "GroundVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedPlan" ADD CONSTRAINT "AIGeneratedPlan_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedPlan" ADD CONSTRAINT "AIGeneratedPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AfterActionReport" ADD CONSTRAINT "AfterActionReport_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AfterActionReport" ADD CONSTRAINT "AfterActionReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTemplate" ADD CONSTRAINT "MissionTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MissionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalUpdateItem" ADD CONSTRAINT "ExternalUpdateItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExternalUpdateSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSuggestion" ADD CONSTRAINT "MissionSuggestion_externalUpdateItemId_fkey" FOREIGN KEY ("externalUpdateItemId") REFERENCES "ExternalUpdateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSuggestion" ADD CONSTRAINT "MissionSuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSuggestion" ADD CONSTRAINT "MissionSuggestion_createdMissionTemplateId_fkey" FOREIGN KEY ("createdMissionTemplateId") REFERENCES "MissionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

