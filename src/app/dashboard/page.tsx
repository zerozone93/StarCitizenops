import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { NotificationList } from "@/components/notification-list";
import { OperationCard } from "@/components/operation-card";
import { DashboardEventCalendar } from "@/components/dashboard-event-calendar";
import { FleetSummaryCards } from "@/components/fleet/FleetSummaryCards";
import { getUserFleetData } from "@/lib/fleet-actions";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, requireUser } from "@/lib/session";
import { listDashboardForumPosts, listUserConversations } from "@/server/social";
import { can, hasAppPrivilege } from "@/lib/permissions";
import { approveJoinRequestAction, rejectJoinRequestAction } from "@/app/organizations/actions";
import { getMilitaryRankLabel } from "@/lib/org-ranks";
import type { SiteRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const userMemberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: { appPrivileges: true },
  });
  const organizationIds = userMemberships.map((membership) => membership.organizationId);

  const siteRole = user.siteRole as SiteRole;

  // Check if user can create operations (site admin or has leadership role in any org)
  const canCreateOperation = can("createOperation", siteRole) ||
    userMemberships.some((m) =>
      hasAppPrivilege("createOperation", siteRole, m.role, m.appPrivileges || undefined)
    );

  const managedOrganizationIds = siteRole === "SITE_ADMIN"
    ? (await prisma.organization.findMany({ select: { id: true } })).map((organization) => organization.id)
    : userMemberships
        .filter((membership) => membership.role === "OWNER" || membership.role === "OFFICER")
        .map((membership) => membership.organizationId);

  const [operations, dashboardEvents, organizations, notifications, feed, fleet, forumPosts, conversations, pendingJoinRequests, viewerTimezone] = await Promise.all([
    prisma.operation.findMany({
      where: {
        OR: [{ commanderId: user.id }, { participants: { some: { userId: user.id } } }],
      },
      include: { organization: true },
      orderBy: { startTime: "asc" },
      take: 4,
    }),
    prisma.operation.findMany({
      where: {
        startTime: { not: null },
        OR: [
          { commanderId: user.id },
          { participants: { some: { userId: user.id } } },
          {
            organizationId: {
              in: organizationIds.length ? organizationIds : ["__none__"],
            },
          },
        ],
      },
      include: {
        organization: { select: { name: true, tag: true } },
        rsvps: { select: { status: true } },
      },
      orderBy: { startTime: "asc" },
      take: 80,
    }),
    prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: { organization: true },
      take: 5,
    }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.activityFeedItem.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    getUserFleetData(user.id),
    listDashboardForumPosts(user.id),
    listUserConversations(user.id),
    managedOrganizationIds.length
      ? prisma.organizationJoinRequest.findMany({
          where: {
            status: "PENDING",
            organizationId: { in: managedOrganizationIds },
          },
          include: {
            organization: { select: { id: true, name: true, tag: true } },
            user: { select: { id: true, name: true, email: true, starCitizenHandle: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    getUserTimezone(user.id),
  ]);

  const eventCalendarItems = dashboardEvents.map((event) => {
    const attendeeSummary = {
      attending: event.rsvps.filter((rsvp) => rsvp.status === "GOING").length,
      maybe: event.rsvps.filter((rsvp) => rsvp.status === "MAYBE").length,
      declined: event.rsvps.filter((rsvp) => rsvp.status === "DECLINED").length,
      standby: event.rsvps.filter((rsvp) => rsvp.status === "STANDBY").length,
    };

    return {
      id: event.id,
      title: event.title,
      startTime: event.startTime?.toISOString() || new Date().toISOString(),
      endTime: event.endTime?.toISOString() || null,
      status: event.status,
      threatLevel: event.threatLevel,
      organizationName: event.organization?.name || null,
      organizationTag: event.organization?.tag || null,
      objective: event.objective,
      description: event.description,
      attendeeSummary,
    };
  });

  const socialBriefPosts = forumPosts.slice(0, 3);
  const socialBriefChannels = conversations.slice(0, 4);

  return (
    <AppShell title="Dashboard" subtitle="Operational overview">
      <section className="rounded-3xl border border-orange-300/25 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-cyan-400/5 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-orange-100/85">Quick start</p>
        <div className="mt-2 flex flex-col gap-3">
          <h3 className="text-3xl font-semibold text-orange-50">Command Snapshot</h3>
          <div className="flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap">
            {canCreateOperation && (
              <Link className="rounded-lg border border-orange-200/50 bg-orange-300/15 px-3 py-1.5 text-orange-50" href="/operations/new">
                Stage Operation
              </Link>
            )}
            <Link className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 px-3 py-1.5 text-cyan-100" href="/ai-planner">AI Planner</Link>
            <Link className="rounded-lg border border-slate-300/30 bg-slate-300/10 px-3 py-1.5 text-slate-100" href="/organizations">Find Org</Link>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Everything important lives here first: operations, notifications, calendars, and the fastest links to planning tools.
        </p>
      </section>

      <section className="grid gap-4">
        <div className="rounded-2xl border border-orange-300/25 bg-slate-900/65 p-4">
          <p className="text-xs uppercase tracking-wide text-orange-200/80">Operations</p>
          <p className="mt-1 text-4xl font-semibold text-orange-50">{operations.length}</p>
          <p className="mt-1 text-xs text-orange-100/70">Assigned or led by you</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/25 bg-slate-900/65 p-4">
          <p className="text-xs uppercase tracking-wide text-cyan-200/80">Organizations</p>
          <p className="mt-1 text-4xl font-semibold text-cyan-100">{organizations.length}</p>
          <p className="mt-1 text-xs text-cyan-100/70">You belong to</p>
        </div>
        <div className="rounded-2xl border border-amber-300/25 bg-slate-900/65 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-200/80">Events</p>
          <p className="mt-1 text-4xl font-semibold text-amber-100">{eventCalendarItems.length}</p>
          <p className="mt-1 text-xs text-amber-100/70">Scheduled across your orgs</p>
        </div>
        <div className="rounded-2xl border border-slate-400/30 bg-slate-900/65 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Available assets</p>
          <p className="mt-1 text-4xl font-semibold text-slate-50">{fleet.summary.availableAssetCount}</p>
          <p className="mt-1 text-xs text-slate-400">Ready to deploy</p>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="space-y-3 rounded-2xl border border-orange-300/20 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold text-orange-100">Upcoming operations</h3>
          {operations.length ? operations.map((operation) => <OperationCard key={operation.id} operation={operation} viewerTimezone={viewerTimezone} />) : <EmptyState title="No assigned operations" description="Operations show here when you lead or participate in them." />}
        </div>

        <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Notifications</h3>
          <NotificationList notifications={notifications} />
        </div>
      </section>

      <section className="grid gap-4">
        <DashboardEventCalendar events={eventCalendarItems} userTimezone={viewerTimezone} />

        <article className="space-y-4 rounded-2xl border border-purple-300/20 bg-slate-900/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-purple-100">Sosial Forum digest</h3>
            <Link
              href="/social"
              className="rounded-lg border border-purple-300/40 bg-purple-300/10 px-2.5 py-1 text-xs text-purple-100"
            >
              Open Sosial Forum
            </Link>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-purple-200/75">Recent forum posts</p>
            <ul className="mt-2 space-y-2">
              {socialBriefPosts.map((post) => (
                <li key={post.id} className="rounded-lg border border-purple-300/20 bg-purple-500/5 p-2.5">
                  <p className="text-sm font-medium text-purple-50">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-300">{post.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {post.type} | {post._count.replies} replies
                  </p>
                </li>
              ))}
              {!socialBriefPosts.length ? (
                <li className="text-sm text-slate-400">No Sosial Forum posts yet.</li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-purple-200/75">Active channels</p>
            <ul className="mt-2 space-y-2">
              {socialBriefChannels.map((conversation) => (
                <li key={conversation.id} className="rounded-lg border border-cyan-300/20 bg-cyan-500/5 p-2.5">
                  <Link href={`/social?channel=${conversation.id}`} className="text-sm font-medium text-cyan-100">
                    {conversation.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {conversation.organization
                      ? `${conversation.organization.name} (${conversation.organization.tag})`
                      : "Direct conversation"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-300">
                    {conversation.messages[0]?.body || "No messages yet"}
                  </p>
                </li>
              ))}
              {!socialBriefChannels.length ? (
                <li className="text-sm text-slate-400">No channels available yet.</li>
              ) : null}
            </ul>
          </div>
        </article>
      </section>

      {managedOrganizationIds.length ? (
        <section className="rounded-2xl border border-emerald-300/20 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-emerald-100">Membership approvals</h3>
            <p className="text-xs text-slate-400">Leadership queue for organization join requests</p>
          </div>

          <div className="mt-3 space-y-3">
            {pendingJoinRequests.map((request) => (
              <article key={request.id} className="rounded-lg border border-emerald-300/20 bg-emerald-500/5 p-3">
                <p className="font-medium text-emerald-50">
                  {request.user.name || request.user.email} → {request.organization.name} [{request.organization.tag}]
                </p>
                {request.user.starCitizenHandle ? (
                  <p className="mt-1 text-xs text-slate-400">@{request.user.starCitizenHandle}</p>
                ) : null}
                <div className="mt-2 grid gap-2 text-xs text-slate-300">
                  <p><span className="font-semibold text-emerald-100">SC Username:</span> {request.applicantHandle}</p>
                  <p><span className="font-semibold text-emerald-100">Preferred Role:</span> {request.preferredRole}</p>
                  <p><span className="font-semibold text-emerald-100">Availability:</span> {request.weeklyAvailability}</p>
                  <p><span className="font-semibold text-emerald-100">Why Join:</span> {request.reasonToJoin}</p>
                </div>
                {request.message ? <p className="mt-2 text-sm text-slate-300">Notes: {request.message}</p> : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={approveJoinRequestAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="organizationId" value={request.organizationId} />
                    <input type="hidden" name="redirectTo" value="/dashboard" />
                    <select
                      name="role"
                      defaultValue="MEMBER"
                      className="rounded-md border border-emerald-400/30 bg-slate-950 px-2 py-1 text-xs"
                    >
                      <option value="MEMBER">{getMilitaryRankLabel("MEMBER")}</option>
                      <option value="TEAM_LEADER">{getMilitaryRankLabel("TEAM_LEADER")}</option>
                      <option value="COMMANDER">{getMilitaryRankLabel("COMMANDER")}</option>
                      <option value="OFFICER">{getMilitaryRankLabel("OFFICER")}</option>
                      <option value="GUEST">{getMilitaryRankLabel("GUEST")}</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-100"
                    >
                      Approve
                    </button>
                  </form>

                  <form action={rejectJoinRequestAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="organizationId" value={request.organizationId} />
                    <input type="hidden" name="redirectTo" value="/dashboard" />
                    <input
                      name="reason"
                      placeholder="Optional reason"
                      className="rounded-md border border-rose-400/30 bg-slate-950 px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))}

            {!pendingJoinRequests.length ? (
              <p className="text-sm text-slate-400">No pending join requests for your managed organizations.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-amber-300/20 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-amber-100">Personal Fleet Summary</h3>
          {canCreateOperation && (
            <Link href="/fleet" className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-100">
              Manage Fleet
            </Link>
          )}
        </div>
        <FleetSummaryCards summary={fleet.summary} />
        <p className="text-xs text-slate-400">Your personal ships and vehicles available for operations.</p>
      </section>

      <section className="rounded-2xl border border-slate-300/20 bg-slate-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Recent activity</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {feed.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-500/30 p-2.5">
              <p className="font-medium text-slate-100">{item.title}</p>
              <p>{item.body}</p>
            </li>
          ))}
          {!feed.length ? <li className="text-slate-400">No activity yet.</li> : null}
        </ul>
      </section>
    </AppShell>
  );
}
