import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { compare } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "commander@starcitizenops.local" },
  });
  
  if (!user) {
    console.log("User not found");
    return;
  }
  
  console.log("User found:", user.email);
  console.log("Has passwordHash:", !!user.passwordHash);
  
  if (user.passwordHash) {
    const valid = await compare("password123", user.passwordHash);
    console.log("Password matches:", valid);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
