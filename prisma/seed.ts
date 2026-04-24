import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const user = await prisma.user.upsert({
    where: { email: "commander@starops.dev" },
    update: {},
    create: {
      name: "Admiral Chen",
      email: "commander@starops.dev",
      starCitizenHandle: "AdmiralChen",
      bio: "Fleet commander with 500+ hours in Stanton",
      timezone: "UTC-5",
      availability: "Weekends, Evenings EST",
      preferredRoles: ["Command", "Pilot", "Fleet Coordinator"],
    },
  })
  console.log("Created user:", user.email)

  const org = await prisma.organization.upsert({
    where: { tag: "IRON" },
    update: {},
    create: {
      name: "Iron Wolves PMC",
      tag: "IRON",
      description: "Elite private military contractor specializing in fleet combat operations and security contracts.",
      focusType: "MILITARY",
      visibility: "PUBLIC",
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER", title: "Supreme Commander" },
      },
    },
  })
  console.log("Created org:", org.name)

  const op = await prisma.operation.upsert({
    where: { id: "seed-op-1" },
    update: {},
    create: {
      id: "seed-op-1",
      title: "Operation Iron Dawn",
      type: "FLEET_PATROL",
      description: "Fleet patrol of Stanton system outer boundaries. Anti-piracy sweep with three Hammerheads.",
      objective: "Clear pirate presence from the Pyro jump point corridor and establish safe transit lanes.",
      location: "Stanton System – Pyro Jump Point",
      threatLevel: "HIGH",
      status: "PLANNING",
      visibility: "PUBLIC",
      commanderId: user.id,
      organizationId: org.id,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      missionBrief: "Three Hammerheads will form a patrol line across the Pyro jump point approach vector. Fighter screen of 6 Arrows will provide cover. Expect organized pirate resistance.",
      rulesOfEngagement: "Weapons free on any hostile vessel. Civilian ships are NOT to be engaged. Disable and board for priority targets.",
      contingencyPlans: "If primary fleet is disabled, retreat to Area 18 and regroup. Secondary rally point is Grim HEX.",
      participants: {
        create: { userId: user.id, assignedRole: "Fleet Commander", status: "CONFIRMED" },
      },
    },
  })
  console.log("Created operation:", op.title)

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "GENERAL",
      title: "Welcome to StarCitizenOps",
      body: "Your operations platform is ready. Create your first operation or join an organization.",
      read: false,
    },
  })

  console.log("Seed complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
