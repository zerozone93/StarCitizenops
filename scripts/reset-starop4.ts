import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AssetStatus,
  OrganizationFocusType,
  OrganizationMemberRole,
  OrganizationVisibility,
  PrismaClient,
  ShipRole,
  ShipSize,
} from "@prisma/client";
import { hashSync } from "bcryptjs";
import { STAR_CITIZEN_SHIPS } from "../src/data/starCitizenShips";
import { syncRealScMissions } from "../src/server/real-sc-missions";
import { verifyStarCitizenOrganizationByTag } from "../src/lib/star-citizen-org";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const LEADER_EMAIL = "zerozone2@live.com";
const LEADER_PASSWORD = "James=on90";
const LEADER_NAME = "zerozone93";
const LEADER_HANDLE = "zerozone93";
const ORG_NAME = "StarOP4";
const ORG_TAG = "SOP4";

async function main() {
  console.log("Resetting organization data...");

  await prisma.organization.deleteMany();
  await prisma.ship.deleteMany();
  await prisma.groundVehicle.deleteMany();

  const passwordHash = hashSync(LEADER_PASSWORD, 10);
  const leader = await prisma.user.upsert({
    where: { email: LEADER_EMAIL },
    update: {
      name: LEADER_NAME,
      passwordHash,
      starCitizenHandle: LEADER_HANDLE,
      bio: "StarOP4 founder and command lead.",
      timezone: "UTC",
      availability: "Daily 18:00-23:00 UTC",
      preferredRoles: ["Commander", "Pilot", "Logistics"],
    },
    create: {
      name: LEADER_NAME,
      email: LEADER_EMAIL,
      passwordHash,
      starCitizenHandle: LEADER_HANDLE,
      bio: "StarOP4 founder and command lead.",
      timezone: "UTC",
      availability: "Daily 18:00-23:00 UTC",
      preferredRoles: ["Commander", "Pilot", "Logistics"],
    },
    select: {
      id: true,
      email: true,
      name: true,
      starCitizenHandle: true,
    },
  });

  const verification = await verifyStarCitizenOrganizationByTag(ORG_TAG);

  const organization = await prisma.organization.create({
    data: {
      name: ORG_NAME,
      tag: ORG_TAG,
      description: "StarOP4 is a full-spectrum Star Citizen organization covering command, logistics, mining, salvage, medical, and combined-arms operations.",
      focusType: OrganizationFocusType.MIXED,
      visibility: OrganizationVisibility.PUBLIC,
      logoUrl: "https://robertsspaceindustries.com/media/logo.png",
      bannerUrl: "https://robertsspaceindustries.com/media/banner.jpg",
      starCitizenVerified: verification.verified,
      starCitizenVerificationCheckedAt: verification.checkedAt,
      ownerId: leader.id,
      members: {
        create: {
          userId: leader.id,
          role: OrganizationMemberRole.OWNER,
          title: "Founder",
        },
      },
    },
  });

  const leaderMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: leader.id,
        organizationId: organization.id,
      },
    },
    select: { id: true },
  });

  if (leaderMembership) {
    await prisma.organizationMemberAppPrivilege.create({
      data: {
        organizationMemberId: leaderMembership.id,
        editOrganization: true,
        inviteMembers: true,
        createOperation: true,
        editOperation: true,
        assignRoles: true,
        inviteOrganizations: true,
        viewPrivateOperations: true,
        postAfterActionReports: true,
        manageChannels: true,
      },
    });
  }

  const shipSeed = STAR_CITIZEN_SHIPS.slice(0, 30).map((ship, index) => ({
    userId: leader.id,
    name: ship.name,
    manufacturer: ship.manufacturer,
    role: ship.role as ShipRole,
    size: ship.size as ShipSize,
    quantity: 1,
    status: AssetStatus.AVAILABLE,
    notes: index < 5 ? "StarOP4 command fleet asset" : "StarOP4 fleet asset",
  }));

  await prisma.ship.createMany({ data: shipSeed });

  const missionSyncResult = await syncRealScMissions(prisma);

  console.log(`Seeded organization ${organization.name} (${organization.tag}) for ${leader.email}`);
  console.log(`Added ${shipSeed.length} ships to the leader fleet.`);
  console.log(
    `Restored mission library with ${missionSyncResult.categoryCount} categories and ${missionSyncResult.templateCount} templates.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
