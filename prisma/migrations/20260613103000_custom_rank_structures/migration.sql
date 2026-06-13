ALTER TABLE "OrganizationMember" ADD COLUMN "customRankId" TEXT;

CREATE INDEX "OrganizationMember_customRankId_idx" ON "OrganizationMember"("customRankId");

CREATE TABLE "OrganizationCustomRank" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "baseRole"       "OrganizationMemberRole" NOT NULL DEFAULT 'MEMBER',
  "position"       INTEGER NOT NULL DEFAULT 0,
  "createdById"    TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationCustomRank_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationCustomRank_organizationId_name_key" ON "OrganizationCustomRank"("organizationId", "name");
CREATE INDEX "OrganizationCustomRank_organizationId_position_idx" ON "OrganizationCustomRank"("organizationId", "position");

ALTER TABLE "OrganizationCustomRank"
  ADD CONSTRAINT "OrganizationCustomRank_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationCustomRank"
  ADD CONSTRAINT "OrganizationCustomRank_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember"
  ADD CONSTRAINT "OrganizationMember_customRankId_fkey"
  FOREIGN KEY ("customRankId") REFERENCES "OrganizationCustomRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OrganizationCustomRankAppPrivilege" (
  "id"                       TEXT NOT NULL,
  "organizationCustomRankId" TEXT NOT NULL,
  "editOrganization"         BOOLEAN,
  "inviteMembers"            BOOLEAN,
  "createOperation"          BOOLEAN,
  "editOperation"            BOOLEAN,
  "assignRoles"              BOOLEAN,
  "inviteOrganizations"      BOOLEAN,
  "viewPrivateOperations"    BOOLEAN,
  "postAfterActionReports"   BOOLEAN,
  "manageChannels"           BOOLEAN,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationCustomRankAppPrivilege_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationCustomRankAppPrivilege_organizationCustomRankId_key" ON "OrganizationCustomRankAppPrivilege"("organizationCustomRankId");

ALTER TABLE "OrganizationCustomRankAppPrivilege"
  ADD CONSTRAINT "OrganizationCustomRankAppPrivilege_organizationCustomRankId_fkey"
  FOREIGN KEY ("organizationCustomRankId") REFERENCES "OrganizationCustomRank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
