import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  approveJoinRequestAction,
  cancelOrganizationInviteAction,
  createOrganizationEventAction,
  deleteOrganizationEventAction,
  postOrganizationBulletinAction,
  rejectJoinRequestAction,
  resetJoinApplicationQuestionsAction,
  sendOrganizationInviteAction,
  submitJoinRequest,
  updateJoinApplicationQuestionsAction,
  updateOrganizationEventAction,
} from "@/app/organizations/actions";
import {
  createForumPostAction,
  createForumReplyAction,
} from "@/app/social/actions";
import { OrgFleetReadinessPanel } from "@/components/fleet/OrgFleetReadinessPanel";
import { OrganizationMembersDropdown } from "@/components/organization-members-dropdown";
import { OrganizationEventCalendar } from "@/components/organization-event-calendar";
import { LiveChat } from "@/components/social/live-chat";
import { calculateOrgFleetReadiness } from "@/lib/fleet";
import { getMilitaryRankLabel } from "@/lib/org-ranks";
import { hasAppPrivilege } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, requireUser } from "@/lib/session";
import type { SiteRole } from "@prisma/client";
import {
  listOrganizationForumPosts,
  listOrganizationChannels,
  listConversationMessages,
} from "@/server/social";
import {
  listOrganizationPendingInvites,
  listOrganizationPendingJoinRequests,
} from "@/server/organization-social";

export const dynamic = "force-dynamic";

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ channel?: string }>;
}) {
  const user = await requireUser();
  const [{ id }, { channel: activeChannelId }, viewerTimezone] = await Promise.all([params, searchParams, getUserTimezone(user.id)]);

  const [organization, membership, myPendingJoinRequest] = await Promise.all([
    prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        tag: true,
        description: true,
        ownerId: true,
        joinQuestionHandle: true,
        joinQuestionPreferredRole: true,
        joinQuestionAvailability: true,
        joinQuestionReason: true,
      },
    }),
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: id } },
      include: {
        appPrivileges: true,
      },
    }),
    prisma.organizationJoinRequest.findFirst({
      where: { organizationId: id, userId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  if (!organization) notFound();

  const isAdmin = user.siteRole === "SITE_ADMIN";
  const isMember = isAdmin || Boolean(membership);
  const canManagePrivileges = isMember
    ? hasAppPrivilege(
        "assignRoles",
        user.siteRole as SiteRole,
        membership?.role,
        membership?.appPrivileges || undefined
      )
    : false;
  const canEditOrganization = isAdmin || organization.ownerId === user.id;
  const canManageGrowth =
    isMember
      ? hasAppPrivilege(
          "inviteMembers",
          user.siteRole as SiteRole,
          membership?.role,
          membership?.appPrivileges || undefined
        )
      : false;
  const canPostBulletins =
    isMember
      ? hasAppPrivilege(
          "postAfterActionReports",
          user.siteRole as SiteRole,
          membership?.role,
          membership?.appPrivileges || undefined
        )
      : false;
  const canManageEvents = isMember
    ? hasAppPrivilege(
        "editOperation",
        user.siteRole as SiteRole,
        membership?.role,
        membership?.appPrivileges || undefined
      )
    : false;
  const canCreateEvents = isMember
    ? hasAppPrivilege(
        "createOperation",
        user.siteRole as SiteRole,
        membership?.role,
        membership?.appPrivileges || undefined
      )
    : false;

  const [organizationMembers, operations, activity, pendingInvites, pendingJoinRequests, readiness, forumPosts, orgChannels] =
    isMember
      ? await Promise.all([
          prisma.organizationMember.findMany({
            where: { organizationId: id },
            include: { user: true },
            orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          }),
          prisma.operation.findMany({
            where: { organizationId: id },
            include: {
              rsvps: {
                select: { status: true },
              },
            },
            orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
            take: 40,
          }),
          prisma.activityFeedItem.findMany({
            where: { organizationId: id },
            orderBy: { createdAt: "desc" },
            take: 20,
          }),
          canManageGrowth ? listOrganizationPendingInvites(id) : Promise.resolve([]),
          canManageGrowth ? listOrganizationPendingJoinRequests(id) : Promise.resolve([]),
          calculateOrgFleetReadiness(id),
          listOrganizationForumPosts(user.id, id),
          listOrganizationChannels(user.id, id),
        ])
      : [[], [], [], [], [], null, [], []];

  // Channels
  const typedOrgChannels = orgChannels as Awaited<ReturnType<typeof listOrganizationChannels>>;
  const activeChannel =
    typedOrgChannels.find((c) => c.id === activeChannelId) || typedOrgChannels[0] || null;
  const channelMessages = activeChannel
    ? await listConversationMessages(user.id, activeChannel.id)
    : [];

  // Members usable as mention targets
  const chatMembers = isMember
    ? organizationMembers.map((m: { user: { id: string; name: string | null; starCitizenHandle: string | null } }) => ({
        id: m.user.id,
        name: m.user.name,
        starCitizenHandle: m.user.starCitizenHandle,
      }))
    : [];

  const bulletins = activity.filter((item) => item.type === "organization_bulletin");
  const events = operations.filter((operation) => operation.startTime);
  const calendarEvents = events.map((event) => {
    const attendeeSummary = {
      attending: event.rsvps.filter((rsvp) => rsvp.status === "GOING").length,
      maybe: event.rsvps.filter((rsvp) => rsvp.status === "MAYBE").length,
      declined: event.rsvps.filter((rsvp) => rsvp.status === "DECLINED").length,
      standby: event.rsvps.filter((rsvp) => rsvp.status === "STANDBY").length,
    };

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime?.toISOString() || new Date().toISOString(),
      endTime: event.endTime?.toISOString() || null,
      location: event.location,
      status: event.status,
      threatLevel: event.threatLevel,
      attendeeSummary,
    };
  });

  if (!isMember) {
    return (
      <AppShell title={organization.name} subtitle={`Tag: ${organization.tag}`}>
        <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Organization Bio</h3>
          <p className="mt-2 text-sm text-slate-300">
            {organization.description || "No description yet."}
          </p>

          <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <h4 className="font-semibold text-cyan-100">Join this organization</h4>
            {myPendingJoinRequest ? (
              <p className="mt-2 text-sm text-slate-300">
                Your join request is pending leadership review.
              </p>
            ) : (
              <form action={submitJoinRequest} className="mt-3 space-y-3">
                <input type="hidden" name="organizationId" value={organization.id} />
                <input
                  type="hidden"
                  name="redirectTo"
                  value={`/organizations/${organization.id}`}
                />
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {organization.joinQuestionHandle}
                  </label>
                  <input
                    name="applicantHandle"
                    required
                    placeholder="Your in-game handle"
                    className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {organization.joinQuestionPreferredRole}
                  </label>
                  <input
                    name="preferredRole"
                    required
                    placeholder="Pilot, logistics, medic, security..."
                    className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {organization.joinQuestionAvailability}
                  </label>
                  <input
                    name="weeklyAvailability"
                    required
                    placeholder="Example: 3-4 evenings/week, UTC-5"
                    className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {organization.joinQuestionReason}
                  </label>
                  <textarea
                    name="reasonToJoin"
                    required
                    placeholder="Short answer"
                    className="min-h-20 w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  />
                </div>
                <textarea
                  name="message"
                  placeholder="Anything else leadership should know? (optional)"
                  className="min-h-20 w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Submit application
                </button>
              </form>
            )}
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title={organization.name} subtitle={`Tag: ${organization.tag}`}>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {canManagePrivileges ? (
          <Link
            href={`/organizations/${organization.id}/members-privileges`}
            className="rounded-md bg-orange-500/20 px-3 py-2 text-sm text-orange-100"
          >
            Member privileges
          </Link>
        ) : null}
        {canEditOrganization ? (
          <Link
            href={`/organizations/${organization.id}/edit`}
            className="rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100"
          >
            Edit organization
          </Link>
        ) : null}
      </div>

      <section className="grid gap-4">
        {canManageGrowth ? (
          <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
            <h3 className="text-lg font-semibold text-cyan-100">Application Questions</h3>
            <p className="mt-1 text-sm text-slate-300">
              Customize the short application prompts shown to players requesting to join this organization.
            </p>
            <form action={updateJoinApplicationQuestionsAction} className="mt-3 grid gap-3">
              <input type="hidden" name="organizationId" value={organization.id} />
              <input type="hidden" name="redirectTo" value={`/organizations/${organization.id}`} />

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Question 1 (Handle)</label>
                <input
                  name="joinQuestionHandle"
                  defaultValue={organization.joinQuestionHandle}
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Question 2 (Role)</label>
                <input
                  name="joinQuestionPreferredRole"
                  defaultValue={organization.joinQuestionPreferredRole}
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Question 3 (Availability)</label>
                <input
                  name="joinQuestionAvailability"
                  defaultValue={organization.joinQuestionAvailability}
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Question 4 (Why Join)</label>
                <input
                  name="joinQuestionReason"
                  defaultValue={organization.joinQuestionReason}
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  required
                />
              </div>

              <div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Save application questions
                  </button>
                </div>
              </div>
            </form>
            <form action={resetJoinApplicationQuestionsAction} className="mt-2">
              <input type="hidden" name="organizationId" value={organization.id} />
              <input type="hidden" name="redirectTo" value={`/organizations/${organization.id}`} />
              <button
                type="submit"
                className="rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20"
              >
                Reset to defaults
              </button>
            </form>
          </article>
        ) : null}

        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Overview</h3>
          <p className="mt-2 text-sm text-slate-300">{organization.description || "No description yet."}</p>
        </article>

        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Member list</h3>
          <OrganizationMembersDropdown
            members={organizationMembers.map((member) => ({
              id: member.id,
              role: member.role,
              title: member.title,
              joinedAt: member.joinedAt.toISOString(),
              user: {
                name: member.user.name,
                email: member.user.email,
                starCitizenHandle: member.user.starCitizenHandle,
              },
            }))}
          />
        </article>
      </section>

      {/* Org Channels & Live Chat */}
      <section className="grid gap-4">
        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Channels</h3>
          <p className="mt-1 text-xs text-slate-400">Live channels for this organization only.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {typedOrgChannels.map((ch) => (
              <li key={ch.id}>
                <Link
                  href={`/organizations/${organization.id}?channel=${ch.id}`}
                  className={`block rounded-lg border p-2 ${activeChannel?.id === ch.id ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300 hover:border-cyan-500/30"}`}
                >
                  <span className="font-medium">{ch.title}</span>
                  {ch.description ? <p className="mt-0.5 text-xs text-slate-400">{ch.description}</p> : null}
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{ch.messages[0]?.body || "No messages yet"}</p>
                </Link>
              </li>
            ))}
            {!typedOrgChannels.length ? <li className="text-slate-400">No channels yet.</li> : null}
          </ul>
        </article>

        <div>
          {activeChannel ? (
            <LiveChat
              conversationId={activeChannel.id}
              currentUserId={user.id}
              members={chatMembers}
              initialMessages={channelMessages.map((m) => ({
                ...m,
                createdAt: m.createdAt.toISOString(),
              }))}
            />
          ) : (
            <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-cyan-100">Org Chat</h3>
              <p className="mt-2 text-sm text-slate-400">No channels available yet.</p>
            </section>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-fuchsia-500/20 bg-slate-900/50 p-4">
        <h3 className="text-lg font-semibold text-fuchsia-100">Organization Forum</h3>
        <p className="mt-1 text-xs text-slate-400">Member-only forum for internal planning and discussion.</p>

        <form action={createForumPostAction} className="mt-4 grid gap-2 rounded-lg border border-fuchsia-500/20 bg-slate-950/60 p-3">
          <input type="hidden" name="organizationId" value={organization.id} />
          <input type="hidden" name="redirectTo" value={`/organizations/${organization.id}`} />
          <select
            name="type"
            defaultValue="TOPIC"
            className="rounded-md border border-fuchsia-500/30 bg-slate-900 px-3 py-2 text-sm text-fuchsia-100"
          >
            <option value="TOPIC">Topic</option>
            <option value="QUESTION">Question</option>
          </select>
          <input
            name="title"
            placeholder="Thread title"
            required
            maxLength={140}
            className="rounded-md border border-fuchsia-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <textarea
            name="body"
            placeholder="Share internal updates, planning notes, or requests"
            required
            maxLength={5000}
            className="min-h-24 rounded-md border border-fuchsia-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" name="agreedToGuidelines" required className="h-4 w-4" />
            I agree to the community guidelines.
          </label>
          <button
            type="submit"
            className="rounded-md bg-fuchsia-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Post to Organization Forum
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {forumPosts.map((post) => (
            <article key={post.id} className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/5 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-fuchsia-500/20 px-2 py-0.5 text-fuchsia-100">{post.type}</span>
                <span className="text-slate-400">
                  by {post.author.starCitizenHandle || post.author.name || post.author.email || "Operator"} · {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <h4 className="mt-2 text-base font-semibold text-slate-100">{post.title}</h4>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{post.body}</p>

              <div className="mt-3 space-y-2 border-t border-fuchsia-500/20 pt-3">
                {post.replies.map((reply) => (
                  <div key={reply.id} className="rounded-md border border-fuchsia-500/20 bg-slate-950/70 p-2">
                    <p className="text-xs text-slate-400">
                      {reply.author.starCitizenHandle || reply.author.name || reply.author.email || "Operator"} · {new Date(reply.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-200">{reply.body}</p>
                  </div>
                ))}
                {!post.replies.length ? <p className="text-xs text-slate-500">No replies yet.</p> : null}
              </div>

              {!post.locked ? (
                <form action={createForumReplyAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="redirectTo" value={`/organizations/${organization.id}`} />
                  <input
                    name="body"
                    maxLength={5000}
                    required
                    placeholder="Reply to this thread"
                    className="w-full rounded-md border border-fuchsia-500/20 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  />
                  <button type="submit" className="rounded-md bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-slate-950">
                    Reply
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Replies are disabled for this post.</p>
              )}
            </article>
          ))}
          {!forumPosts.length ? <p className="text-sm text-slate-400">No organization forum posts yet.</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <OrganizationEventCalendar
          organizationId={organization.id}
          events={calendarEvents}
          canCreateEvents={Boolean(canCreateEvents)}
          canManageEvents={canManageEvents}
          canRSVPEvents={Boolean(isMember)}
          createEventAction={createOrganizationEventAction}
          updateEventAction={updateOrganizationEventAction}
          deleteEventAction={deleteOrganizationEventAction}
          userTimezone={viewerTimezone}
        />
      </section>

      <section className="grid gap-4">
        <article className="rounded-xl border border-orange-500/20 bg-slate-900/50 p-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-orange-100">Organization bulletins</h3>
            <p className="text-xs text-slate-400">Member discussions and planning notes</p>
          </div>

          {canPostBulletins ? (
            <form action={postOrganizationBulletinAction} className="mt-4 space-y-3">
              <input type="hidden" name="organizationId" value={organization.id} />
              <input type="hidden" name="redirectTo" value={`/organizations/${organization.id}`} />
              <input
                name="title"
                placeholder="Bulletin title"
                className="w-full rounded-md border border-orange-500/30 bg-slate-950 p-2 text-sm"
              />
              <textarea
                name="body"
                placeholder="Post a bulletin for members, event prep, logistics, or social updates."
                className="min-h-28 w-full rounded-md border border-orange-500/30 bg-slate-950 p-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-50"
              >
                Post bulletin
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Only organization leadership can post bulletins.</p>
          )}

          <div className="mt-4 space-y-3">
            {bulletins.map((item) => (
              <div key={item.id} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <p className="font-medium text-orange-50">{item.title}</p>
                {item.body ? <p className="mt-2 text-sm text-slate-300">{item.body}</p> : null}
                <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!bulletins.length ? <p className="text-sm text-slate-400">No bulletins yet.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Membership pipeline</h3>

          {canManageGrowth ? (
            <>
              <form
                action={sendOrganizationInviteAction}
                className="mt-4 space-y-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4"
              >
                <input type="hidden" name="organizationId" value={organization.id} />
                <input type="hidden" name="redirectTo" value={`/organizations/${organization.id}`} />
                <input
                  name="email"
                  type="email"
                  placeholder="pilot@starcitizenops.local"
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                />
                <select
                  name="role"
                  defaultValue="MEMBER"
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                >
                  <option value="MEMBER">Crewman</option>
                  <option value="TEAM_LEADER">Lieutenant</option>
                  <option value="COMMANDER">Commander</option>
                  <option value="OFFICER">Captain</option>
                  <option value="GUEST">Civilian Contractor</option>
                </select>
                <textarea
                  name="message"
                  placeholder="Optional invite note"
                  className="min-h-20 w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Send invite
                </button>
              </form>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-cyan-100">Pending join requests</h4>
                  <div className="mt-3 space-y-3">
                    {pendingJoinRequests.map((request) => (
                      <div key={request.id} className="rounded-lg border border-cyan-500/20 p-3">
                        <p className="font-medium text-cyan-50">{request.user.name || request.user.email}</p>
                        {request.user.starCitizenHandle ? (
                          <p className="text-xs text-slate-500">@{request.user.starCitizenHandle}</p>
                        ) : null}
                        {request.message ? (
                          <p className="mt-2 text-sm text-slate-300">{request.message}</p>
                        ) : null}
                        <div className="mt-2 grid gap-2 text-xs text-slate-300">
                          <p><span className="font-semibold text-cyan-100">SC Username:</span> {request.applicantHandle}</p>
                          <p><span className="font-semibold text-cyan-100">Preferred Role:</span> {request.preferredRole}</p>
                          <p><span className="font-semibold text-cyan-100">Availability:</span> {request.weeklyAvailability}</p>
                          <p><span className="font-semibold text-cyan-100">Why Join:</span> {request.reasonToJoin}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <form action={approveJoinRequestAction} className="flex flex-wrap gap-2">
                            <input type="hidden" name="requestId" value={request.id} />
                            <input type="hidden" name="organizationId" value={organization.id} />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={`/organizations/${organization.id}`}
                            />
                            <select
                              name="role"
                              defaultValue="MEMBER"
                              className="rounded-md border border-cyan-500/30 bg-slate-950 px-2 py-1 text-xs"
                            >
                              <option value="MEMBER">Crewman</option>
                              <option value="TEAM_LEADER">Lieutenant</option>
                              <option value="COMMANDER">Commander</option>
                              <option value="OFFICER">Captain</option>
                              <option value="GUEST">Civilian Contractor</option>
                            </select>
                            <button
                              type="submit"
                              className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100"
                            >
                              Approve
                            </button>
                          </form>
                          <form action={rejectJoinRequestAction} className="flex flex-wrap gap-2">
                            <input type="hidden" name="requestId" value={request.id} />
                            <input type="hidden" name="organizationId" value={organization.id} />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={`/organizations/${organization.id}`}
                            />
                            <input
                              name="reason"
                              placeholder="Optional reason"
                              className="rounded-md border border-rose-500/30 bg-slate-950 px-2 py-1 text-xs"
                            />
                            <button
                              type="submit"
                              className="rounded-md bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                    {!pendingJoinRequests.length ? (
                      <p className="text-sm text-slate-400">No pending join requests.</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-cyan-100">Pending invites</h4>
                  <div className="mt-3 space-y-3">
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} className="rounded-lg border border-cyan-500/20 p-3">
                        <p className="font-medium text-cyan-50">{invite.email}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          Invited as {getMilitaryRankLabel(invite.role)}
                        </p>
                        {invite.message ? <p className="mt-2 text-sm text-slate-400">{invite.message}</p> : null}
                        <form action={cancelOrganizationInviteAction} className="mt-3">
                          <input type="hidden" name="inviteId" value={invite.id} />
                          <input type="hidden" name="organizationId" value={organization.id} />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={`/organizations/${organization.id}`}
                          />
                          <button
                            type="submit"
                            className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-100"
                          >
                            Cancel invite
                          </button>
                        </form>
                      </div>
                    ))}
                    {!pendingInvites.length ? (
                      <p className="text-sm text-slate-400">No pending invites.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Owners and officers manage invites and join approvals.
            </p>
          )}
        </article>
      </section>

      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <h3 className="text-lg font-semibold text-cyan-100">Plans and operations</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          {operations.map((operation) => (
            <li key={operation.id} className="rounded border border-cyan-500/20 p-2">
              <div className="flex flex-col gap-2">
                <Link href={`/operations/${operation.id}`} className="text-cyan-300">
                  {operation.title}
                </Link>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                  {operation.status}
                </span>
              </div>
              {operation.startTime ? (
                <p className="mt-1 text-xs text-slate-500">
                  Starts {new Date(operation.startTime).toLocaleString()}
                </p>
              ) : null}
            </li>
          ))}
          {!operations.length ? <li className="text-slate-400">No operations created yet.</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-orange-500/20 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-orange-100">Organization activity</h3>
          <p className="text-xs text-slate-400">Recent member-only planning signals</p>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {activity.map((item) => (
            <li key={item.id} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
              <p className="font-medium text-orange-50">{item.title}</p>
              {item.body ? <p className="mt-1 text-slate-300">{item.body}</p> : null}
              <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
            </li>
          ))}
          {!activity.length ? <li className="text-slate-400">No organization activity yet.</li> : null}
        </ul>
      </section>

      {readiness ? <OrgFleetReadinessPanel readiness={readiness} /> : null}
    </AppShell>
  );
}
