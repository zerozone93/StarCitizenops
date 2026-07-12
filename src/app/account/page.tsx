import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      starCitizenHandle: true,
      bio: true,
      timezone: true,
      availability: true,
      preferredRoles: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  return (
    <AppShell title="Account" subtitle="Operator identity & settings">
      <AccountClient user={user} />
    </AppShell>
  );
}
