import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { preferredRoleOptions } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

async function updateProfile(formData: FormData) {
  "use server";
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") || ""),
    starCitizenHandle: String(formData.get("starCitizenHandle") || ""),
    bio: String(formData.get("bio") || ""),
    timezone: String(formData.get("timezone") || ""),
    availability: String(formData.get("availability") || ""),
    preferredRoles: formData.getAll("preferredRoles").map(String),
  });

  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      starCitizenHandle: parsed.data.starCitizenHandle,
      bio: parsed.data.bio,
      timezone: parsed.data.timezone,
      availability: parsed.data.availability,
      preferredRoles: parsed.data.preferredRoles || [],
    },
  });

  revalidatePath("/profile");
  revalidatePath("/fleet");
  redirect("/profile");
}

export default async function EditProfilePage() {
  const user = await requireUser();
  const profile = await prisma.user.findUnique({ where: { id: user.id } });

  if (!profile) return null;

  return (
    <AppShell title="Edit Profile" subtitle="Update operator readiness">
      <form action={updateProfile} className="space-y-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" defaultValue={profile.name || ""} required className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Display name" />
          <input name="starCitizenHandle" defaultValue={profile.starCitizenHandle || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Star Citizen handle" />
          <input name="timezone" defaultValue={profile.timezone || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Time zone" />
          <input name="availability" defaultValue={profile.availability || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Availability" />
          <textarea name="bio" defaultValue={profile.bio || ""} className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 md:col-span-2" placeholder="Bio" />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-slate-300">Preferred roles</legend>
          <div className="grid gap-2 md:grid-cols-3">
            {preferredRoleOptions.map((role) => (
              <label key={role} className="flex items-center gap-2 rounded border border-cyan-500/20 p-2 text-sm">
                <input type="checkbox" name="preferredRoles" value={role} defaultChecked={profile.preferredRoles.includes(role)} />
                {role}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="rounded-md border border-cyan-500/20 bg-slate-950/40 p-3 text-sm text-slate-300">
          Fleet editing moved to the dedicated My Fleet workflow for quantity-safe management.
        </div>

        <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save profile</button>
      </form>
    </AppShell>
  );
}
