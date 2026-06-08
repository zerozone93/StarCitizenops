import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CoalitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const coalition = await prisma.coalition.findUnique({
    where: { id },
    include: {
      members: { include: { organization: true } },
      operation: true,
      operations: true,
    },
  });

  if (!coalition) notFound();

  return (
    <AppShell title={coalition.name} subtitle="Coalition detail">
      <section className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <p className="text-sm text-slate-300">{coalition.description || "No description."}</p>
        <p className="text-sm text-slate-300">Command notes: {coalition.commandNotes || "Not set"}</p>
      </section>

      <section className="grid gap-4">
        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Participating organizations</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {coalition.members.map((member) => (
              <li key={member.id} className="rounded border border-cyan-500/20 p-2">
                {member.organization.name} - {member.responsibility || "No responsibility set"}
              </li>
            ))}
            {!coalition.members.length ? <li className="text-slate-400">No organizations assigned yet.</li> : null}
          </ul>
        </article>

        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Shared operations</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {coalition.operations.map((operation) => (
              <li key={operation.id}>{operation.title}</li>
            ))}
            {coalition.operation ? <li>{coalition.operation.title}</li> : null}
            {!coalition.operations.length && !coalition.operation ? <li className="text-slate-400">No linked operations yet.</li> : null}
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
