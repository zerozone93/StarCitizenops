import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { syncRealScMissions } from "../src/server/real-sc-missions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Replacing mission library with real Star Citizen contracts/events...");
  const { categoryCount, templateCount } = await syncRealScMissions(prisma);

  console.log(JSON.stringify({ categoryCount, templateCount }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
