import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { OperationCard } from "@/components/operation-card";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const user = await requireUser();
  try {
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
  } catch {
    return (
      <AppShell title="Operations" subtitle="Mission board">
        <section className="rounded-xl border border-amber-300/20 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold text-amber-100">Operations are temporarily unavailable</h3>
          <p className="mt-2 text-sm text-slate-300">
            We cannot load operation data right now due to an upstream database outage.
          </p>
          <div className="mt-4">
            <Link href="/dashboard" className="rounded-md border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100">
              Back to dashboard
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }
}
