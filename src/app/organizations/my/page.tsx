import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MyOrganizationRedirectPage() {
  const user = await requireUser();

  if (user.siteRole === "SITE_ADMIN") {
    const firstOrganization = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (firstOrganization) {
      redirect(`/organizations/${firstOrganization.id}`);
    }

    redirect("/organizations");
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    select: { organizationId: true },
  });

  if (membership) {
    redirect(`/organizations/${membership.organizationId}`);
  }

  redirect("/organizations");
}
