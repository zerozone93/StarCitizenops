import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: (process.env as unknown as Record<string, string | undefined>).DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users found:", users.length);
  users.forEach(u => {
    console.log(`- ${u.email}: ${u.name}`);
  });
  await prisma.$disconnect();
}

main().catch(console.error);
