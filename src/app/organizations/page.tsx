import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { OrganizationCard } from "@/components/organization-card";
import {
  acceptInviteAction,
  cancelJoinRequestAction,
  declineInviteAction,
} from "@/app/organizations/actions";
import { prisma } from "@/lib/prisma";
import { getMilitaryRankLabel } from "@/lib/org-ranks";
import { requireUser } from "@/lib/session";
import {
  listUserJoinRequests,
  listUserPendingOrganizationInvites,
} from "@/server/organization-social";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const user = await requireUser();
  const [organizations, invites, joinRequests] = await Promise.all([
    prisma.organization.findMany({ orderBy: { createdAt: "desc" } }),
    listUserPendingOrganizationInvites(user.id, user.email),
    listUserJoinRequests(user.id),
  ]);

  return (
    <AppShell title="Organizations" subtitle="Command structures">
      <section className="mb-6 grid gap-4">
        <article className="rounded-xl border border-orange-300/20 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-orange-100">Invitation inbox</h2>
          <div className="mt-3 space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="rounded-lg border border-orange-300/20 bg-orange-300/5 p-3">
                <p className="font-medium text-orange-50">{invite.organization.name} [{invite.organization.tag}]</p>
                <p className="mt-1 text-sm text-slate-300">
                  Invited by {invite.inviter.name || invite.inviter.email} as {getMilitaryRankLabel(invite.role)}.
                </p>
                {invite.message ? <p className="mt-2 text-sm text-slate-400">{invite.message}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={acceptInviteAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <input type="hidden" name="redirectTo" value="/organizations" />
                    <button className="rounded-md bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100" type="submit">Accept invite</button>
                  </form>
                  <form action={declineInviteAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <input type="hidden" name="redirectTo" value="/organizations" />
                    <button className="rounded-md bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100" type="submit">Decline</button>
                  </form>
                </div>
              </div>
            ))}
            {!invites.length ? <p className="text-sm text-slate-400">No pending invites.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border border-cyan-300/20 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-cyan-100">My join requests</h2>
          <div className="mt-3 space-y-3">
            {joinRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3">
                <p className="font-medium text-cyan-50">{request.organization.name} [{request.organization.tag}]</p>
                <p className="mt-1 text-sm text-slate-300">Status: {request.status.replaceAll("_", " ").toLowerCase()}</p>
                {request.message ? <p className="mt-2 text-sm text-slate-400">{request.message}</p> : null}
                {request.status === "PENDING" ? (
                  <form action={cancelJoinRequestAction} className="mt-3">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="redirectTo" value="/organizations" />
                    <button className="rounded-md bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-100" type="submit">Cancel request</button>
                  </form>
                ) : null}
              </div>
            ))}
            {!joinRequests.length ? <p className="text-sm text-slate-400">No join requests yet.</p> : null}
          </div>
        </article>
      </section>

      <div className="grid gap-3">
        {organizations.map((organization) => <OrganizationCard key={organization.id} organization={organization} />)}
      </div>
      {!organizations.length ? <EmptyState title="No organizations" description="Create the first organization to begin planning operations." /> : null}
    </AppShell>
  );
}
