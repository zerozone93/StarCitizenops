import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { OperationCard } from "@/components/operation-card";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const user = await requireUser();
  const [operations, viewerTimezone] = await Promise.all([
    prisma.operation.findMany({ include: { organization: true }, orderBy: { createdAt: "desc" } }),
    getUserTimezone(user.id),
  ]);

  return (
    <AppShell title="Operations" subtitle="Mission board">
      <div className="mb-4 flex flex-col gap-2">
        <Link href="/operations/new" className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">Create operation</Link>
      </div>
      <div className="grid gap-3">
        {operations.map((operation) => <OperationCard key={operation.id} operation={operation} viewerTimezone={viewerTimezone} />)}
      </div>
      {!operations.length ? <EmptyState title="No operations" description="Create your first operation to start planning." /> : null}
    </AppShell>
  );
}
