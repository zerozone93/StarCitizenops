import { OrganizationFocusType, OrganizationVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DiscordOrgSettings } from "@/components/discord-org-settings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

async function updateOrganization(formData: FormData) {
  "use server";

  const user = await requireUser();
  const id = String(formData.get("id") || "");

  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization || organization.ownerId !== user.id) return;

  await prisma.organization.update({
    where: { id },
    data: {
      name: String(formData.get("name") || ""),
      tag: String(formData.get("tag") || "").toUpperCase(),
      description: String(formData.get("description") || ""),
      focusType: String(formData.get("focusType") || OrganizationFocusType.MIXED) as OrganizationFocusType,
      visibility: String(formData.get("visibility") || OrganizationVisibility.PUBLIC) as OrganizationVisibility,
    },
  });

  revalidatePath(`/organizations/${id}`);
  redirect(`/organizations/${id}`);
}

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const organization = await prisma.organization.findUnique({ where: { id } });

  if (!organization) notFound();

  if (organization.ownerId !== user.id) {
    return (
      <AppShell title="Edit Organization" subtitle="Permission denied">
        <p className="text-rose-300">Only the organization owner can edit this profile.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Organization" subtitle={organization.name}>
      <div className="space-y-6">
      <form action={updateOrganization} className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <input type="hidden" name="id" value={organization.id} />
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" defaultValue={organization.name} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" />
          <input name="tag" defaultValue={organization.tag} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" />
          <select name="focusType" defaultValue={organization.focusType} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
            {Object.values(OrganizationFocusType).map((item) => <option key={item}>{item}</option>)}
          </select>
          <select name="visibility" defaultValue={organization.visibility} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
            {Object.values(OrganizationVisibility).map((item) => <option key={item}>{item}</option>)}
          </select>
          <textarea name="description" defaultValue={organization.description || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" />
        </div>
        <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save changes</button>
      </form>

        <DiscordOrgSettings
          organizationId={organization.id}
          initial={{
            discordGuildId: organization.discordGuildId,
            discordBotToken: organization.discordBotToken,
            discordOperationsChannelId: organization.discordOperationsChannelId,
            discordRoleSyncEnabled: organization.discordRoleSyncEnabled,
          }}
        />
      </div>
    </AppShell>
  );
}
