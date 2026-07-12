import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // After a database reset, old session tokens may reference users that no longer exist.
  // Redirect to login instead of letting downstream queries fail with misleading DB errors.
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!existingUser) {
    redirect("/login");
  }

  return session.user;
}

export async function getUserTimezone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return user?.timezone ?? null;
}
