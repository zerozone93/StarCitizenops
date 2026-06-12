import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AssetStatus,
  OrganizationFocusType,
  OrganizationMemberRole,
  OrganizationVisibility,
  PrismaClient,
  ShipRole,
  ShipSize,
  SiteRole,
} from "@prisma/client";
import { syncRealScMissions } from "../src/server/real-sc-missions";

type FleetItem = {
  name: string;
  manufacturer: string;
  role: ShipRole;
  size: ShipSize;
  quantity: number;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const databaseUrl = requiredEnv("DATABASE_URL");
  const email = requiredEnv("UPDATE_USER_EMAIL");
  const password = requiredEnv("UPDATE_USER_PASSWORD");
  const name = requiredEnv("UPDATE_USER_NAME");
  const handle = requiredEnv("UPDATE_USER_HANDLE");
  const orgName = requiredEnv("UPDATE_ORG_NAME");
  const orgTag = requiredEnv("UPDATE_ORG_TAG").toUpperCase();

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  const fleet: FleetItem[] = [
    {
      name: "Freelancer",
      manufacturer: "MISC",
      role: ShipRole.CARGO,
      size: ShipSize.MEDIUM,
      quantity: 1,
    },
    {
      name: "Tiburon",
      manufacturer: "Anvil",
      role: ShipRole.FIGHTER,
      size: ShipSize.SMALL,
      quantity: 1,
    },
    {
      name: "F7C Hornet",
      manufacturer: "Anvil",
      role: ShipRole.FIGHTER,
      size: ShipSize.SMALL,
      quantity: 2,
    },
    {
      name: "Perseus",
      manufacturer: "RSI",
      role: ShipRole.CORVETTE,
      size: ShipSize.LARGE,
      quantity: 1,
    },
  ];

  try {
    const passwordHash = await hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        starCitizenHandle: handle,
        passwordHash,
        siteRole: SiteRole.MEMBER,
        termsAcceptedAt: new Date(),
        termsAcceptedVersion: "2026-06-07",
      },
      create: {
        email,
        name,
        starCitizenHandle: handle,
        passwordHash,
        siteRole: SiteRole.MEMBER,
        termsAcceptedAt: new Date(),
        termsAcceptedVersion: "2026-06-07",
      },
    });

    const organization = await prisma.organization.upsert({
      where: { tag: orgTag },
      update: {
        name: orgName,
        ownerId: user.id,
        visibility: OrganizationVisibility.PUBLIC,
        focusType: OrganizationFocusType.MIXED,
      },
      create: {
        name: orgName,
        tag: orgTag,
        ownerId: user.id,
        visibility: OrganizationVisibility.PUBLIC,
        focusType: OrganizationFocusType.MIXED,
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: OrganizationMemberRole.OWNER,
        title: "Founder",
      },
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: OrganizationMemberRole.OWNER,
        title: "Founder",
      },
    });

    await prisma.ship.deleteMany({ where: { userId: user.id } });

    await prisma.ship.createMany({
      data: fleet.map((ship) => ({
        userId: user.id,
        name: ship.name,
        manufacturer: ship.manufacturer,
        role: ship.role,
        size: ship.size,
        quantity: ship.quantity,
        status: AssetStatus.AVAILABLE,
        notes: "Updated via update-staropps-data script",
      })),
    });

    const missionSyncResult = await syncRealScMissions(prisma);

    console.log(
      JSON.stringify(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            starCitizenHandle: user.starCitizenHandle,
          },
          organization: {
            id: organization.id,
            name: organization.name,
            tag: organization.tag,
          },
          fleet: fleet.map((ship) => ({ name: ship.name, quantity: ship.quantity })),
          missionSyncResult,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
