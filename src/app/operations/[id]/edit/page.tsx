import { OperationType, ThreatLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DateTimePickerFormField } from "@/components/ui/date-time-picker-form-field";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, requireUser } from "@/lib/session";
import { formatDateTimeLocalValueInTimeZone } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function updateOperation(formData: FormData) {
  "use server";
  const user = await requireUser();

  const id = String(formData.get("id") || "");
  const operation = await prisma.operation.findUnique({ where: { id } });
  if (!operation || operation.commanderId !== user.id) return;

  await prisma.operation.update({
    where: { id },
    data: {
      title: String(formData.get("title") || ""),
      type: String(formData.get("type") || OperationType.CUSTOM_OPERATION) as OperationType,
      startTime: new Date(String(formData.get("startTime") || operation.startTime?.toISOString() || new Date().toISOString())),
      location: String(formData.get("location") || ""),
      objective: String(formData.get("objective") || ""),
      description: String(formData.get("description") || ""),
      threatLevel: String(formData.get("threatLevel") || ThreatLevel.MODERATE) as ThreatLevel,
      missionBrief: String(formData.get("missionBrief") || ""),
      missionPhases: String(formData.get("missionPhases") || ""),
      requiredShips: String(formData.get("requiredShips") || ""),
      requiredGroundVehicles: String(formData.get("requiredGroundVehicles") || ""),
      requiredPersonnel: String(formData.get("requiredPersonnel") || ""),
      commsPlan: String(formData.get("commsPlan") || ""),
      rulesOfEngagement: String(formData.get("rulesOfEngagement") || ""),
      rallyPoints: String(formData.get("rallyPoints") || ""),
      extractionPlan: String(formData.get("extractionPlan") || ""),
      contingencyPlans: String(formData.get("contingencyPlans") || ""),
      requiredSupplies: String(formData.get("requiredSupplies") || ""),
    },
  });

  // Best-effort Discord update message for orgs with bot + channel configured.
  const [updatedOperation, orgForDiscord] = await Promise.all([
    prisma.operation.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        type: true,
        threatLevel: true,
        startTime: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: operation.organizationId },
      select: { name: true, tag: true, discordBotToken: true, discordOperationsChannelId: true },
    }),
  ]);

  if (updatedOperation && orgForDiscord?.discordBotToken && orgForDiscord?.discordOperationsChannelId) {
    await fetch(`https://discord.com/api/v10/channels/${orgForDiscord.discordOperationsChannelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${orgForDiscord.discordBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [{
          title: `Operation Updated: ${updatedOperation.title}`,
          description: updatedOperation.description ?? undefined,
          url: `${process.env.NEXTAUTH_URL}/operations/${updatedOperation.id}`,
          color: 0x5865f2,
          fields: [
            { name: "Status", value: updatedOperation.status, inline: true },
            { name: "Type", value: updatedOperation.type ?? "General", inline: true },
            ...(updatedOperation.threatLevel ? [{ name: "Threat Level", value: updatedOperation.threatLevel, inline: true }] : []),
            ...(updatedOperation.startTime ? [{ name: "Start Time", value: `<t:${Math.floor(new Date(updatedOperation.startTime).getTime() / 1000)}:F>`, inline: false }] : []),
          ],
          footer: { text: `${orgForDiscord.name} · StarCitizenOps` },
          timestamp: new Date().toISOString(),
        }],
      }),
    }).catch(() => {
      // Non-fatal: operation update succeeds even if Discord post fails.
    });
  }

  revalidatePath(`/operations/${id}`);
  redirect(`/operations/${id}`);
}

export default async function EditOperationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const viewerTimezone = await getUserTimezone(user.id);

  const operation = await prisma.operation.findUnique({ where: { id } });
  if (!operation) notFound();

  if (operation.commanderId !== user.id) {
    return (
      <AppShell title="Edit Operation" subtitle="Permission denied">
        <p className="text-rose-300">Only the operation commander can edit this operation.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Operation" subtitle={operation.title}>
      <form action={updateOperation} className="space-y-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <input type="hidden" name="id" value={operation.id} />
        <section className="space-y-3 rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4">
          <div>
            <h3 className="text-sm font-semibold text-cyan-100">Basics</h3>
            <p className="text-xs text-slate-400">Keep the core mission details accurate.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input name="title" defaultValue={operation.title} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Operation name" />
            <select name="type" defaultValue={operation.type} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
              {Object.values(OperationType).map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="location" defaultValue={operation.location || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Location or system" />
            <DateTimePickerFormField
              name="startTime"
              initialValue={operation.startTime ? formatDateTimeLocalValueInTimeZone(operation.startTime.toISOString(), viewerTimezone) : ""}
              required
              label="Start time"
            />
            <select name="threatLevel" defaultValue={operation.threatLevel} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2">
              {Object.values(ThreatLevel).map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </section>

        <details className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4">
          <summary className="cursor-pointer list-none">
            <div>
              <h3 className="text-sm font-semibold text-cyan-100">Advanced mission details</h3>
              <p className="text-xs text-slate-400">Open this to edit the full operational brief and execution plan.</p>
            </div>
          </summary>

          <div className="mt-4 space-y-3">
            <section className="space-y-3 rounded-xl border border-cyan-500/10 bg-slate-950/30 p-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Mission brief</h4>
                <p className="text-xs text-slate-400">What the team needs to understand at a glance.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <textarea name="objective" defaultValue={operation.objective || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" placeholder="Objective" />
                <textarea name="description" defaultValue={operation.description || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" placeholder="Description" />
                <textarea name="missionBrief" defaultValue={operation.missionBrief || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" placeholder="Mission brief" />
                <input name="requiredShips" defaultValue={operation.requiredShips || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Required ships" />
                <input name="requiredGroundVehicles" defaultValue={operation.requiredGroundVehicles || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Required ground vehicles" />
                <input name="requiredPersonnel" defaultValue={operation.requiredPersonnel || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Required personnel" />
                <textarea name="requiredSupplies" defaultValue={operation.requiredSupplies || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" placeholder="Required supplies" />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-cyan-500/10 bg-slate-950/30 p-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Execution plan</h4>
                <p className="text-xs text-slate-400">Use these fields for the actual briefing flow and fallback plans.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <textarea name="missionPhases" defaultValue={operation.missionPhases || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" placeholder="Mission phases" />
                <textarea name="commsPlan" defaultValue={operation.commsPlan || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Comms plan" />
                <textarea name="rulesOfEngagement" defaultValue={operation.rulesOfEngagement || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Rules of engagement" />
                <textarea name="rallyPoints" defaultValue={operation.rallyPoints || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Rally points" />
                <textarea name="extractionPlan" defaultValue={operation.extractionPlan || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Extraction plan" />
                <textarea name="contingencyPlans" defaultValue={operation.contingencyPlans || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" placeholder="Contingency plans" />
              </div>
            </section>
          </div>
        </details>

        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save operation</button>
        </div>
      </form>
    </AppShell>
  );
}
