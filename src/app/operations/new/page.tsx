import { OperationType, ThreatLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DateTimePickerFormField } from "@/components/ui/date-time-picker-form-field";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { operationSchema } from "@/lib/validators";
import { convertISOToDateTimeLocal } from "@/lib/utils";

export const dynamic = "force-dynamic";

function addRecurringOffset(base: Date, index: number, cadence: "DAILY" | "WEEKLY" | "MONTHLY") {
  const next = new Date(base);
  if (cadence === "DAILY") {
    next.setDate(next.getDate() + index);
    return next;
  }
  if (cadence === "WEEKLY") {
    next.setDate(next.getDate() + index * 7);
    return next;
  }
  next.setMonth(next.getMonth() + index);
  return next;
}

async function createOperation(formData: FormData) {
  "use server";
  const user = await requireUser();

  const missionTemplateId = formData.get("missionTemplateId") ? String(formData.get("missionTemplateId")) : null;

  const parsed = operationSchema.safeParse({
    title: String(formData.get("title") || ""),
    type: String(formData.get("type") || OperationType.CUSTOM_OPERATION),
    startTime: String(formData.get("startTime") || ""),
    location: String(formData.get("location") || ""),
    objective: String(formData.get("objective") || ""),
    description: String(formData.get("description") || ""),
    threatLevel: String(formData.get("threatLevel") || ThreatLevel.MODERATE),
    organizationId: String(formData.get("organizationId") || ""),
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
  });

  if (!parsed.success) return;

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: parsed.data.organizationId,
      },
    },
    select: { organizationId: true },
  });

  if (!membership) return;

  const startTime = new Date(parsed.data.startTime);
  if (Number.isNaN(startTime.getTime())) return;

  const recurrence = String(formData.get("recurrence") || "NONE");
  const recurrenceCount = Math.min(
    52,
    Math.max(1, Number.parseInt(String(formData.get("recurrenceCount") || "1"), 10) || 1)
  );
  const cadence = recurrence === "DAILY" || recurrence === "WEEKLY" || recurrence === "MONTHLY" ? recurrence : "NONE";
  const totalOccurrences = cadence === "NONE" ? 1 : recurrenceCount;

  let firstOperationId = "";

  for (let index = 0; index < totalOccurrences; index += 1) {
    const occurrenceStartTime =
      cadence === "NONE" ? startTime : addRecurringOffset(startTime, index, cadence);

    const operation = await prisma.operation.create({
      data: {
        title: parsed.data.title,
        type: parsed.data.type as OperationType,
        startTime: occurrenceStartTime,
        location: parsed.data.location,
        objective: parsed.data.objective,
        description: parsed.data.description,
        threatLevel: parsed.data.threatLevel as ThreatLevel,
        commanderId: user.id,
        organizationId: parsed.data.organizationId,
        missionTemplateId: missionTemplateId || null,
        missionPhases: parsed.data.missionPhases,
        requiredShips: parsed.data.requiredShips,
        requiredGroundVehicles: parsed.data.requiredGroundVehicles,
        requiredPersonnel: parsed.data.requiredPersonnel,
        commsPlan: parsed.data.commsPlan,
        rulesOfEngagement: parsed.data.rulesOfEngagement,
        rallyPoints: parsed.data.rallyPoints,
        extractionPlan: parsed.data.extractionPlan,
        contingencyPlans: parsed.data.contingencyPlans,
        requiredSupplies: parsed.data.requiredSupplies,
        participants: {
          create: {
            userId: user.id,
            assignedRole: "Commander",
            team: "Command",
            status: "GOING",
          },
        },
      },
    });

    if (!firstOperationId) firstOperationId = operation.id;

    await prisma.activityFeedItem.create({
      data: {
        type: "operation_created",
        title:
          totalOccurrences > 1
            ? `Recurring operation created: ${operation.title} (${index + 1}/${totalOccurrences})`
            : `Operation created: ${operation.title}`,
        body: `New operation staged by ${user.name || user.email}.`,
        userId: user.id,
        operationId: operation.id,
      },
    });

    // Post Discord alert if org has a webhook configured (first occurrence only)
    if (index === 0) {
      const orgForDiscord = await prisma.organization.findUnique({
        where: { id: parsed.data.organizationId },
        select: { name: true, tag: true, discordBotToken: true, discordOperationsChannelId: true },
      });
      if (orgForDiscord?.discordBotToken && orgForDiscord?.discordOperationsChannelId) {
        const webhookUrl = `https://discord.com/api/v10/channels/${orgForDiscord.discordOperationsChannelId}/messages`;
        // Use bot token to post, not a webhook URL — post via channel message endpoint
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            Authorization: `Bot ${orgForDiscord.discordBotToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [{
              title: operation.title,
              description: operation.description ?? undefined,
              url: `${process.env.NEXTAUTH_URL}/operations/${operation.id}`,
              color: 0x1abc9c,
              fields: [
                { name: "Status", value: operation.status, inline: true },
                { name: "Type", value: operation.type ?? "General", inline: true },
                ...(operation.threatLevel ? [{ name: "Threat Level", value: operation.threatLevel, inline: true }] : []),
                ...(operation.startTime ? [{ name: "Start Time", value: `<t:${Math.floor(new Date(operation.startTime).getTime() / 1000)}:F>`, inline: false }] : []),
              ],
              footer: { text: `${orgForDiscord.name} · StarCitizenOps` },
              timestamp: new Date().toISOString(),
            }],
            components: [{
              type: 1, // ACTION_ROW
              components: [
                { type: 2, custom_id: `rsvp_yes_${operation.id}`, label: "RSVP ✅", style: 3 },
                { type: 2, custom_id: `rsvp_no_${operation.id}`, label: "Decline ❌", style: 4 },
                { type: 2, label: "View Operation", style: 5, url: `${process.env.NEXTAUTH_URL}/operations/${operation.id}` },
              ],
            }],
          }),
        }).catch(() => {}); // Non-fatal
      }
    }
  }

  revalidatePath("/operations");
  redirect(`/operations/${firstOperationId}`);
}

export default async function NewOperationPage({ searchParams }: { searchParams: Promise<{ template?: string; ai_title?: string; ai_type?: string; ai_inGameContract?: string; ai_location?: string; ai_objective?: string; ai_description?: string; ai_threatLevel?: string; ai_requiredShips?: string; ai_requiredGroundVehicles?: string; ai_requiredPersonnel?: string; ai_missionPhases?: string; ai_commsPlan?: string; ai_rulesOfEngagement?: string; ai_rallyPoints?: string; ai_extractionPlan?: string; ai_contingencyPlans?: string; ai_requiredSupplies?: string; ai_startTime?: string }> }) {
  const user = await requireUser();
  const memberships = await prisma.organizationMember.findMany({ where: { userId: user.id }, include: { organization: true } });

  const resolvedSearchParams = await searchParams;
  const ai = {
    title: resolvedSearchParams.ai_title || "",
    type: resolvedSearchParams.ai_type || "",
    inGameContract: resolvedSearchParams.ai_inGameContract || "",
    location: resolvedSearchParams.ai_location || "",
    objective: resolvedSearchParams.ai_objective || "",
    description: resolvedSearchParams.ai_description || "",
    threatLevel: resolvedSearchParams.ai_threatLevel || "",
    requiredShips: resolvedSearchParams.ai_requiredShips || "",
    requiredGroundVehicles: resolvedSearchParams.ai_requiredGroundVehicles || "",
    requiredPersonnel: resolvedSearchParams.ai_requiredPersonnel || "",
    missionPhases: resolvedSearchParams.ai_missionPhases || "",
    commsPlan: resolvedSearchParams.ai_commsPlan || "",
    rulesOfEngagement: resolvedSearchParams.ai_rulesOfEngagement || "",
    rallyPoints: resolvedSearchParams.ai_rallyPoints || "",
    extractionPlan: resolvedSearchParams.ai_extractionPlan || "",
    contingencyPlans: resolvedSearchParams.ai_contingencyPlans || "",
    requiredSupplies: resolvedSearchParams.ai_requiredSupplies || "",
    startTime: resolvedSearchParams.ai_startTime || "",
  };
  const hasAiPrefill = Boolean(ai.title);
  const aiDescriptionWithContract = ai.inGameContract
    ? `[In-Game Contract] ${ai.inGameContract}\n\n${ai.description || ""}`.trim()
    : ai.description;
  let template = null;
  if (resolvedSearchParams.template) {
    template = await prisma.missionTemplate.findUnique({
      where: { id: resolvedSearchParams.template },
    });
  }

  const selectedOrganizationId = memberships[0]?.organizationId || "";

  return (
    <AppShell title="Create Operation" subtitle={template ? `From: ${template.name}` : hasAiPrefill ? "Pre-filled from AI Planner" : "Mission planning"}>
      {template && (
        <div className="mb-4 rounded-md border border-blue-500/30 bg-blue-950/20 p-3">
          <p className="text-sm text-blue-200">
            <strong>Template:</strong> {template.name} • <strong>Difficulty:</strong> {template.difficulty}
          </p>
        </div>
      )}
      {hasAiPrefill && !template && (
        <div className="mb-4 rounded-md border border-cyan-500/30 bg-cyan-950/20 p-3">
          <p className="text-sm text-cyan-200">Fields pre-filled from AI Planner. Review and adjust before creating.</p>
        </div>
      )}
      <form action={createOperation} className="space-y-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        {template && <input type="hidden" name="missionTemplateId" value={template.id} />}

        <section className="space-y-3 rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4">
          <div>
            <h3 className="text-sm font-semibold text-cyan-100">Basics</h3>
            <p className="text-xs text-slate-400">Set the name, org, timing, and mission type first.</p>
          </div>
          <div className="grid gap-3">
            <input name="title" required defaultValue={ai.title || template?.name || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Operation name" />
            <select name="type" defaultValue={ai.type || (template?.tags?.includes("combat") ? OperationType.BOUNTY_OPERATION : OperationType.CUSTOM_OPERATION)} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
              {Object.values(OperationType).map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="organizationId" required defaultValue={selectedOrganizationId} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
              {memberships.map((membership) => (
                <option key={membership.organizationId} value={membership.organizationId}>
                  {membership.organization.name}
                </option>
              ))}
            </select>
            <input name="location" defaultValue={ai.location || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Location or system" />
            <DateTimePickerFormField
              name="startTime"
              initialValue={convertISOToDateTimeLocal(ai.startTime) || ""}
              required
              label="Start time"
            />
            <select name="recurrence" defaultValue="NONE" className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
              <option value="NONE">Does not repeat</option>
              <option value="DAILY">Repeat daily</option>
              <option value="WEEKLY">Repeat weekly</option>
              <option value="MONTHLY">Repeat monthly</option>
            </select>
            <input type="number" name="recurrenceCount" min={1} max={52} defaultValue={1} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Occurrences" />
          </div>
        </section>

        <details className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4">
          <summary className="cursor-pointer list-none">
            <div>
              <h3 className="text-sm font-semibold text-cyan-100">Advanced mission details</h3>
              <p className="text-xs text-slate-400">Open this if you want to fill out the full operational brief.</p>
            </div>
          </summary>

          <div className="mt-4 space-y-3">
            <section className="space-y-3 rounded-xl border border-cyan-500/10 bg-slate-950/30 p-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Mission brief</h4>
                <p className="text-xs text-slate-400">What the crew needs to know at a glance.</p>
              </div>
              <div className="grid gap-3">
                <select name="threatLevel" defaultValue={ai.threatLevel || ThreatLevel.MODERATE} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
                  {Object.values(ThreatLevel).map((item) => <option key={item}>{item}</option>)}
                </select>
                <input name="requiredPersonnel" defaultValue={ai.requiredPersonnel || (template ? `${template.recommendedPlayersMin}-${template.recommendedPlayersMax}` : "")} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Required personnel" />
                <input name="requiredShips" defaultValue={ai.requiredShips || template?.requiredAssets?.filter((a) => a.toLowerCase().includes("ship")).join(", ") || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Required ships" />
                <input name="requiredGroundVehicles" defaultValue={ai.requiredGroundVehicles || template?.requiredAssets?.filter((a) => a.toLowerCase().includes("vehicle")).join(", ") || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Required ground vehicles" />
                <textarea name="objective" defaultValue={ai.objective || template?.objectives?.join(". ") || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Objective" />
                <textarea name="description" defaultValue={aiDescriptionWithContract || template?.description || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Brief description" />
                <input name="requiredSupplies" defaultValue={ai.requiredSupplies || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Required supplies" />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-cyan-500/10 bg-slate-950/30 p-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Execution plan</h4>
                <p className="text-xs text-slate-400">Breakdown the mission into clear steps and fallback plans.</p>
              </div>
              <div className="grid gap-3">
                <input name="missionPhases" defaultValue={ai.missionPhases || template?.executionSteps?.join(" > ") || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Mission phases (use > separator)" />
                <textarea name="commsPlan" defaultValue={ai.commsPlan || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Comms plan" />
                <textarea name="rulesOfEngagement" defaultValue={ai.rulesOfEngagement || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Rules of engagement" />
                <textarea name="rallyPoints" defaultValue={ai.rallyPoints || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Rally points" />
                <textarea name="extractionPlan" defaultValue={ai.extractionPlan || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Extraction plan" />
                <textarea name="contingencyPlans" defaultValue={ai.contingencyPlans || template?.failureConditions?.join(". ") || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Contingency plans" />
              </div>
            </section>
          </div>
        </details>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-400">Everything is grouped so you can fill the form top to bottom without hunting for fields.</p>
          <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">
            Create operation
          </button>
        </div>
      </form>
    </AppShell>
  );
}
