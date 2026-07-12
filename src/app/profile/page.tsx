import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FleetReadinessPanel } from "@/components/fleet/FleetReadinessPanel";
import { FleetSummaryCards } from "@/components/fleet/FleetSummaryCards";
import { getUserFleetData } from "@/lib/fleet-actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, fleet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: { ships: true, groundVehicles: true },
    }),
    getUserFleetData(user.id),
  ]);

  if (!profile) return null;

  return (
    <AppShell title="Profile" subtitle="Operator identity">
      <div className="grid gap-4">
        <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Profile details</h3>
          <dl className="mt-3 space-y-2 text-sm text-slate-300">
            <div><dt className="text-slate-400">Display name</dt><dd>{profile.name || "Unset"}</dd></div>
            <div><dt className="text-slate-400">Handle</dt><dd>{profile.starCitizenHandle || "Unset"}</dd></div>
            <div><dt className="text-slate-400">Bio</dt><dd>{profile.bio || "Unset"}</dd></div>
            <div><dt className="text-slate-400">Time zone</dt><dd>{profile.timezone || "Unset"}</dd></div>
            <div><dt className="text-slate-400">Availability</dt><dd>{profile.availability || "Unset"}</dd></div>
            <div><dt className="text-slate-400">Preferred roles</dt><dd>{profile.preferredRoles.join(", ") || "Unset"}</dd></div>
          </dl>
          <Link href="/profile/edit" className="mt-4 inline-block rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-200">Edit profile</Link>
        </section>
        <section className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-cyan-100">Fleet Snapshot</h3>
            <Link href="/fleet" className="rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">
              Manage fleet
            </Link>
          </div>
          <FleetSummaryCards summary={fleet.summary} />
          <FleetReadinessPanel summary={fleet.summary} />
        </section>
      </div>
    </AppShell>
  );
}
