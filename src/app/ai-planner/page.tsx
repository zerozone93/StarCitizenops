import { AIPlannerPanel } from "@/components/ai-planner-panel";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AIPlannerPage() {
  const user = await requireUser();

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <AppShell title="AI Planner" subtitle="Generate structured operation briefs">
      <AIPlannerPanel organizationName={membership?.organization.name || ""} />
    </AppShell>
  );
}
