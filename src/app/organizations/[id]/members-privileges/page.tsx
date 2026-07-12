import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/server/auth";
import { AppShell } from "@/components/app-shell";
import { MemberPrivilegeManager } from "@/components/member-privilege-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganizationMemberRole } from "@prisma/client";
import { hasAppPrivilege } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface MembersPrivilegesPageProps {
  params: Promise<{ id: string }>;
}

export default async function MembersPrivilegesPage({
  params,
}: MembersPrivilegesPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id: organizationId } = await params;

  // Verify user is a member of the organization
  try {
    await requireOrgRole(organizationId, [
      "OWNER",
      "OFFICER",
      "COMMANDER",
      "TEAM_LEADER",
      "MEMBER",
    ]);
  } catch {
    redirect("/organizations");
  }

  // Get user's role in the organization
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId } },
    include: { appPrivileges: true },
  });

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, tag: true },
  });

  if (!org) {
    redirect("/organizations");
  }

  const canManageMembers = membership
    ? hasAppPrivilege("assignRoles", "MEMBER", membership.role, membership.appPrivileges || undefined)
    : false;

  return (
    <AppShell title="Member Privileges" subtitle={`${org.name} [${org.tag}]`}>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-cyan-50">
          Member Privileges - {org.name} [{org.tag}]
        </h1>
        <p className="text-slate-300 mt-1">
          Manage member roles and permissions for your organization
        </p>
      </div>

      {/* Info Cards */}
      {canManageMembers ? (
        <Card className="border-emerald-500/20 bg-emerald-500/10">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-200">
              ✓ You have permission to manage member privileges as a{" "}
              <strong>{membership?.role}</strong>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/20 bg-amber-500/10">
          <CardContent className="p-4">
            <p className="text-sm text-amber-200">
              You do not have permission to manage member privileges. Contact your
              organization leadership.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Role Permission Reference */}
      <Card className="border-cyan-500/20 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-cyan-100">Organization Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <p className="font-semibold text-red-300">OWNER</p>
              <p className="text-red-200/70 text-xs mt-1">
                Full organizational control. Used for founder/leader of the organization.
              </p>
            </div>
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
              <p className="font-semibold text-orange-300">OFFICER</p>
              <p className="text-orange-200/70 text-xs mt-1">
                Leadership role with broad operational authority and member management.
              </p>
            </div>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="font-semibold text-blue-300">COMMANDER</p>
              <p className="text-blue-200/70 text-xs mt-1">
                Tactical leader focused on operation execution and team management. Can
                manage member roles.
              </p>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
              <p className="font-semibold text-cyan-300">TEAM_LEADER</p>
              <p className="text-cyan-200/70 text-xs mt-1">
                Team-level leadership with limited cross-organizational scope and
                operation participation.
              </p>
            </div>
            <div className="rounded-lg border border-slate-500/30 bg-slate-500/5 p-3">
              <p className="font-semibold text-slate-300">MEMBER</p>
              <p className="text-slate-200/70 text-xs mt-1">
                Standard member with full participation rights in organization operations.
              </p>
            </div>
            <div className="rounded-lg border border-gray-500/30 bg-gray-500/5 p-3">
              <p className="font-semibold text-gray-300">GUEST</p>
              <p className="text-gray-200/70 text-xs mt-1">
                Limited access. Can view public content only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Privilege Manager */}
      <MemberPrivilegeManager
        organizationId={organizationId}
        userRole={membership?.role as OrganizationMemberRole | null}
        userId={session.user.id}
      />
    </div>
    </AppShell>
  );
}
