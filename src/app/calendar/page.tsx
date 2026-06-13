import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OrganizationEventCalendar } from "@/components/organization-event-calendar";
import {
  createOrganizationEventAction,
  deleteOrganizationEventAction,
  updateOrganizationEventAction,
} from "@/app/organizations/actions";
import { prisma } from "@/lib/prisma";
import { hasAppPrivilege } from "@/lib/permissions";
import { getUserTimezone, requireUser } from "@/lib/session";
import type { SiteRole } from "@prisma/client";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{ organizationId?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await requireUser();
  const { organizationId } = await searchParams;

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
      appPrivileges: true,
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  if (!memberships.length) {
    return (
      <AppShell title="Calendar" subtitle="Organization events">
        <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">No organization membership found</h3>
          <p className="mt-2 text-sm text-slate-300">
            Join an organization first to access the shared member event calendar.
          </p>
          <Link
            href="/organizations"
            className="mt-4 inline-flex rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Browse organizations
          </Link>
        </section>
      </AppShell>
    );
  }

  const selectedMembership =
    memberships.find((membership) => membership.organizationId === organizationId) || memberships[0];

  const [viewerTimezone, operations] = await Promise.all([
    getUserTimezone(user.id),
    prisma.operation.findMany({
      where: {
        organizationId: selectedMembership.organizationId,
        startTime: {
          not: null,
        },
      },
      include: {
        rsvps: {
          select: { status: true },
        },
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
      take: 120,
    }),
  ]);

  const canManageEvents = hasAppPrivilege(
    "editOperation",
    user.siteRole as SiteRole,
    selectedMembership.role,
    selectedMembership.appPrivileges || undefined
  );
  const canCreateEvents = hasAppPrivilege(
    "createOperation",
    user.siteRole as SiteRole,
    selectedMembership.role,
    selectedMembership.appPrivileges || undefined
  );

  const calendarEvents = operations.map((event) => {
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

  const redirectTo = `/calendar?organizationId=${selectedMembership.organizationId}`;

  return (
    <AppShell
      title="Calendar"
      subtitle={`${selectedMembership.organization.name} [${selectedMembership.organization.tag}]`}
    >
      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-cyan-100">Organization calendar</h3>
            <p className="mt-1 text-xs text-slate-400">
              Quick member calendar access from the sidebar. Switch organizations if you belong to more than one.
            </p>
          </div>

          <form action="/calendar" method="get" className="flex items-center gap-2">
            <label htmlFor="calendar-org-select" className="text-xs uppercase tracking-wide text-cyan-200">
              Organization
            </label>
            <select
              id="calendar-org-select"
              name="organizationId"
              defaultValue={selectedMembership.organizationId}
              className="rounded-md border border-cyan-500/30 bg-slate-950 px-3 py-2 text-sm text-cyan-100"
            >
              {memberships.map((membership) => (
                <option key={membership.organizationId} value={membership.organizationId}>
                  {membership.organization.name} [{membership.organization.tag}]
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100"
            >
              Open
            </button>
          </form>
        </div>

        <OrganizationEventCalendar
          organizationId={selectedMembership.organizationId}
          events={calendarEvents}
          canCreateEvents={canCreateEvents}
          canManageEvents={canManageEvents}
          canRSVPEvents={true}
          createEventAction={createOrganizationEventAction}
          updateEventAction={updateOrganizationEventAction}
          deleteEventAction={deleteOrganizationEventAction}
          userTimezone={viewerTimezone}
          redirectTo={redirectTo}
        />
      </section>
    </AppShell>
  );
}
