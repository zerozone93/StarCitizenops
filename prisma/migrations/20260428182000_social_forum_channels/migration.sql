-- CreateEnum
CREATE TYPE "SocialPostType" AS ENUM ('TOPIC', 'QUESTION', 'GUIDELINE');

-- AlterTable
ALTER TABLE "Conversation"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "isChannel" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "visibility" "OrganizationVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "SocialPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "type" "SocialPostType" NOT NULL DEFAULT 'TOPIC',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "authorId" TEXT NOT NULL,
  "organizationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPostReply" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SocialPostReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialPost_pinned_updatedAt_idx" ON "SocialPost"("pinned", "updatedAt");

-- CreateIndex
CREATE INDEX "SocialPost_organizationId_updatedAt_idx" ON "SocialPost"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "SocialPostReply_postId_createdAt_idx" ON "SocialPostReply"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostReply" ADD CONSTRAINT "SocialPostReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostReply" ADD CONSTRAINT "SocialPostReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
