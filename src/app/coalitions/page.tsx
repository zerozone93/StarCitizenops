import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CoalitionCard } from "@/components/coalition-card";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CoalitionsPage() {
  await requireUser();
  const coalitions = await prisma.coalition.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AppShell title="Coalitions" subtitle="Joint command structures">
      <div className="mb-4 flex flex-col gap-2">
        <Link href="/coalitions/new" className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">Create coalition</Link>
      </div>
      <div className="grid gap-3">
        {coalitions.map((coalition) => <CoalitionCard key={coalition.id} coalition={coalition} />)}
      </div>
      {!coalitions.length ? <EmptyState title="No coalitions" description="Create coalition records for cross-org operations." /> : null}
    </AppShell>
  );
}
