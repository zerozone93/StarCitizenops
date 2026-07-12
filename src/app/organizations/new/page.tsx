import { OrganizationFocusType, OrganizationMemberRole, OrganizationVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { verifyStarCitizenOrganizationByTag } from "@/lib/star-citizen-org";
import { organizationSchema } from "@/lib/validators";

async function createOrganization(formData: FormData) {
  "use server";

  const user = await requireUser();
  const parsed = organizationSchema.safeParse({
    name: String(formData.get("name") || ""),
    tag: String(formData.get("tag") || "").toUpperCase(),
    description: String(formData.get("description") || ""),
    focusType: String(formData.get("focusType") || OrganizationFocusType.MIXED),
    visibility: String(formData.get("visibility") || OrganizationVisibility.PUBLIC),
  });

  if (!parsed.success) return;

  const verification = await verifyStarCitizenOrganizationByTag(parsed.data.tag);

  const organization = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      tag: parsed.data.tag,
      description: parsed.data.description,
      starCitizenVerified: verification.verified,
      starCitizenVerificationCheckedAt: verification.checkedAt,
      focusType: parsed.data.focusType as OrganizationFocusType,
      visibility: parsed.data.visibility as OrganizationVisibility,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: OrganizationMemberRole.OWNER,
          title: "Founder",
        },
      },
    },
  });

  revalidatePath("/organizations");
  redirect(`/organizations/${organization.id}`);
}

export default async function NewOrganizationPage() {
  await requireUser();

  return (
    <AppShell title="Create Organization" subtitle="Establish chain of command">
      <form action={createOrganization} className="space-y-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <section className="space-y-3 rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4">
          <div>
            <h3 className="text-sm font-semibold text-cyan-100">Identity</h3>
            <p className="text-xs text-slate-400">The name and tag people will see everywhere in the app.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Organization name" className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" />
            <input name="tag" required placeholder="Tag (e.g. AEGV)" className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4">
          <div>
            <h3 className="text-sm font-semibold text-cyan-100">Visibility</h3>
            <p className="text-xs text-slate-400">Choose what kind of org this is and who can discover it.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select name="focusType" className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
              {Object.values(OrganizationFocusType).map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="visibility" className="rounded-md border border-cyan-500/30 bg-slate-950 p-2">
              {Object.values(OrganizationVisibility).map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea name="description" placeholder="Short mission statement or operating focus" className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" />
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Create organization</button>
        </div>
      </form>
    </AppShell>
  );
}
