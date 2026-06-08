import Link from "next/link";
import { AssetType } from "@prisma/client";
import { notFound } from "next/navigation";
import { AIPlannerPanel } from "@/components/ai-planner-panel";
import { AppShell } from "@/components/app-shell";
import { AssetList } from "@/components/asset-list";
import { CommentThread } from "@/components/comment-thread";
import { LocalTime } from "@/components/local-time";
import { MissionTimeline } from "@/components/mission-timeline";
import { RSVPPanel } from "@/components/rsvp-panel";
import { RoleBadge } from "@/components/role-badge";
import { StatusBadge } from "@/components/status-badge";
import { ThreatLevelBadge } from "@/components/threat-level-badge";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

async function addAsset(formData: FormData) {
  "use server";
  const user = await requireUser();

  const operationId = String(formData.get("operationId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  await prisma.operationAsset.create({
    data: {
      operationId,
      ownerUserId: user.id,
      assetType: String(formData.get("assetType") || AssetType.OTHER) as AssetType,
      name,
      category: String(formData.get("category") || ""),
      quantity: Number(formData.get("quantity") || 1),
      assignedTo: String(formData.get("assignedTo") || ""),
      notes: String(formData.get("notes") || ""),
    },
  });
}

async function joinOperation(formData: FormData) {
  "use server";
  const user = await requireUser();

  const operationId = String(formData.get("operationId") || "");
  const assignedRole = String(formData.get("assignedRole") || "Member");
  const team = String(formData.get("team") || "General");

  await prisma.operationParticipant.upsert({
    where: { operationId_userId: { operationId, userId: user.id } },
    update: { assignedRole, team },
    create: { operationId, userId: user.id, assignedRole, team, status: "GOING" },
  });

  await prisma.roleAssignment.upsert({
    where: { id: `${operationId}-${user.id}-${assignedRole}` },
    update: { role: assignedRole, team },
    create: {
      id: `${operationId}-${user.id}-${assignedRole}`,
      operationId,
      userId: user.id,
      role: assignedRole,
      team,
    },
  });
}

export default async function OperationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const viewerTimezone = await getUserTimezone(user.id);

  const operation = await prisma.operation.findUnique({
    where: { id },
    include: {
      organization: true,
      participants: { include: { user: true } },
      assets: true,
      comments: {
        include: {
          user: true,
          reactions: {
            select: {
              emoji: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      rsvps: { include: { user: true } },
      aiPlans: { orderBy: { createdAt: "desc" }, take: 1 },
      afterActionReports: true,
    },
  });

  if (!operation) notFound();

  return (
    <AppShell title={operation.title} subtitle="Operation detail">
      <div className="mb-4 flex flex-col gap-2">
        <Link href={`/operations/${operation.id}/edit`} className="rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">Edit</Link>
      </div>

      <section className="grid gap-4">
        <article className="space-y-2 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={operation.status} />
            <ThreatLevelBadge level={operation.threatLevel} />
            <RoleBadge role={operation.type.replaceAll("_", " ")} />
          </div>
          <p className="text-sm text-slate-300">{operation.description || "No description."}</p>
          <p className="text-sm text-slate-300">Objective: {operation.objective || "Unset"}</p>
          <p className="text-sm text-slate-300">Location: {operation.location || "Unset"}</p>
          <p className="text-sm text-slate-300">Participating org: {operation.organization.name}</p>
          {operation.startTime && (
            <p className="text-sm text-slate-300">
              Start time: <LocalTime isoDate={operation.startTime.toISOString()} timezone={viewerTimezone} />
            </p>
          )}

          <div className="grid gap-3">
            <div className="rounded-lg border border-cyan-500/20 p-3">
              <h4 className="font-semibold text-cyan-100">Mission brief</h4>
              <p className="text-sm text-slate-300">{operation.missionBrief || operation.objective || "Not defined."}</p>
            </div>
            <div className="rounded-lg border border-cyan-500/20 p-3">
              <h4 className="font-semibold text-cyan-100">Map/location notes</h4>
              <p className="text-sm text-slate-300">{operation.location || "No location notes."}</p>
            </div>
          </div>
        </article>

        <article className="space-y-2 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Assigned members</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {operation.participants.map((participant) => (
              <li key={participant.id} className="rounded border border-cyan-500/20 p-2">
                {participant.user.name || participant.user.email} - {participant.assignedRole || "Unassigned"}
              </li>
            ))}
            {!operation.participants.length ? <li className="text-slate-400">No participants yet.</li> : null}
          </ul>

          <form action={joinOperation} className="space-y-2">
            <input type="hidden" name="operationId" value={operation.id} />
            <input name="assignedRole" className="w-full rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Assign yourself role" />
            <input name="team" className="w-full rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Team" />
            <button className="rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100" type="submit">Join operation</button>
          </form>
        </article>
      </section>

      <section className="grid gap-4">
        <article className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Fleet and ground assets</h3>
          <AssetList assets={operation.assets} />
          <form action={addAsset} className="grid gap-2">
            <input type="hidden" name="operationId" value={operation.id} />
            <input name="name" required className="rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Asset name" />
            <select name="assetType" className="rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm">
              {Object.values(AssetType).map((value) => <option key={value}>{value}</option>)}
            </select>
            <input name="category" className="rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Category" />
            <input name="quantity" type="number" min="1" defaultValue="1" className="rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Quantity" />
            <input name="assignedTo" className="rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Assigned to" />
            <textarea name="notes" className="rounded border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Notes" />
            <button className="rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100" type="submit">Add asset</button>
          </form>
        </article>

        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-lg font-semibold text-cyan-100">Timeline</h3>
          <MissionTimeline phases={operation.missionPhases} />
        </article>
      </section>

      <section className="grid gap-4">
        <CommentThread operationId={operation.id} comments={operation.comments} currentUserId={user.id} />
        <RSVPPanel operationId={operation.id} entries={operation.rsvps} />
      </section>

      <section className="grid gap-4">
        <AIPlannerPanel operationId={operation.id} />
        <article className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Latest AI plan</h3>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-cyan-500/20 bg-slate-950 p-3 text-xs text-slate-200">
            {operation.aiPlans[0]?.result || "No AI-generated brief saved yet."}
          </pre>
        </article>
      </section>

      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <h3 className="text-lg font-semibold text-cyan-100">After-action report</h3>
        <p className="text-sm text-slate-300">{operation.afterActionReports[0]?.summary || "No after-action report yet."}</p>
      </section>
    </AppShell>
  );
}
