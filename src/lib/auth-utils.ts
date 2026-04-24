import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  return session
}

export async function getFullUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: {
        include: { organization: true },
      },
      ships: true,
      groundVehicles: true,
    },
  })
}
