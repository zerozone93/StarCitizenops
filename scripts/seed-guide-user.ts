import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash("GuidePass123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "guide.user@starcitizenops.local" },
    update: {
      name: "Guide User",
      passwordHash,
      timezone: "UTC",
      starCitizenHandle: "guide_user",
    },
    create: {
      name: "Guide User",
      email: "guide.user@starcitizenops.local",
      passwordHash,
      timezone: "UTC",
      starCitizenHandle: "guide_user",
    },
  });

  const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (firstOrg) {
    await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: firstOrg.id } },
      update: { role: "MEMBER" },
      create: { userId: user.id, organizationId: firstOrg.id, role: "MEMBER" },
    });
  }

  console.log(JSON.stringify({ userEmail: user.email, org: firstOrg?.name ?? null }, null, 2));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
