"use server";

import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { isOrganizationOfficer, isOrganizationCommander, isSiteAdmin } from "@/server/permissions";
import type { OrganizationMemberRole } from "@prisma/client";
import { APP_PRIVILEGE_ACTIONS, type AppPrivilegeAction } from "@/lib/permissions";

const ROLE_POWER: Record<OrganizationMemberRole, number> = {
  OWNER: 5,
  OFFICER: 4,
  COMMANDER: 3,
  TEAM_LEADER: 2,
  MEMBER: 1,
  GUEST: 0,
};

type AppPrivilegeUpdateInput = Partial<Record<AppPrivilegeAction, boolean>>;

export type PrivilegeAuditItem = {
  id: string;
  type: "organization_member_privilege_updated" | "organization_member_role_updated";
  title: string;
  body: string | null;
  createdAt: Date;
  targetUserId: string | null;
  targetUserName: string | null;
  targetUserEmail: string | null;
};

/**
 * Get all members of an organization with their current roles and permissions
 */
export async function getMembersForPrivilegeManagement(
  actorId: string,
  organizationId: string
) {
  // Only commanders, officers, and admins can view member list
  if (!(await isOrganizationCommander(actorId, organizationId))) {
    throw new ForbiddenError("Only commanders can manage member privileges");
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      appPrivileges: true,
      customRank: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, name: true, email: true, image: true, starCitizenHandle: true },
      },
    },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
  });

  return members.map((m) => ({
    memberId: m.id,
    userId: m.user.id,
    userName: m.user.name || "Unknown",
    userEmail: m.user.email,
    userImage: m.user.image,
    starCitizenHandle: m.user.starCitizenHandle,
    currentRole: m.role,
    customRankId: m.customRank?.id || null,
    customRankName: m.customRank?.name || null,
    joinedAt: m.joinedAt,
    appPrivileges: {
      editOrganization: m.appPrivileges?.editOrganization ?? null,
      inviteMembers: m.appPrivileges?.inviteMembers ?? null,
      createOperation: m.appPrivileges?.createOperation ?? null,
      editOperation: m.appPrivileges?.editOperation ?? null,
      assignRoles: m.appPrivileges?.assignRoles ?? null,
      inviteOrganizations: m.appPrivileges?.inviteOrganizations ?? null,
      viewPrivateOperations: m.appPrivileges?.viewPrivateOperations ?? null,
      postAfterActionReports: m.appPrivileges?.postAfterActionReports ?? null,
      manageChannels: m.appPrivileges?.manageChannels ?? null,
    },
  }));
}

export async function updateMemberAppPrivileges(
  actorId: string,
  organizationId: string,
  memberId: string,
  updates: AppPrivilegeUpdateInput
): Promise<{ success: boolean; message: string }> {
  const isOfficer = await isOrganizationOfficer(actorId, organizationId);
  const isAdmin = await isSiteAdmin(actorId);

  if (!isOfficer && !isAdmin) {
    throw new ForbiddenError("Only officers and admins can update member app privileges");
  }

  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: {
      appPrivileges: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!member) {
    throw new NotFoundError("Member not found");
  }

  if (member.organizationId !== organizationId) {
    throw new ForbiddenError("Member does not belong to this organization");
  }

  const actorMembership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId } },
  });

  if (!actorMembership && !isAdmin) {
    throw new ForbiddenError("You must be a member of this organization");
  }

  if (!isAdmin && actorMembership) {
    if (ROLE_POWER[member.role] >= ROLE_POWER[actorMembership.role] && member.userId !== actorId) {
      throw new ForbiddenError("You cannot change privileges of an equal or higher-ranked member");
    }
  }

  const data: Record<string, boolean | null> = {};
  for (const action of APP_PRIVILEGE_ACTIONS) {
    if (typeof updates[action] === "boolean") {
      data[action] = updates[action] ?? null;
    }
  }

  if (!Object.keys(data).length) {
    throw new ValidationError("No app privileges were provided");
  }

  const changedPrivileges = APP_PRIVILEGE_ACTIONS.filter((action) => {
    if (!(action in data)) return false;
    const previous = member.appPrivileges?.[action] ?? null;
    const next = data[action];
    return previous !== next;
  });

  if (!changedPrivileges.length) {
    throw new ValidationError("No app privilege changes detected");
  }

  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { name: true, email: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.organizationMemberAppPrivilege.upsert({
      where: { organizationMemberId: member.id },
      create: {
        organizationMemberId: member.id,
        ...data,
      },
      update: data,
    });

    for (const action of changedPrivileges) {
      const nextValue = data[action] === true;
      await tx.activityFeedItem.create({
        data: {
          type: "organization_member_privilege_updated",
          title: `${member.user.name || member.user.email || "Member"}: ${action}`,
          body: `${actor?.name || actor?.email || "A leader"} set ${action} to ${nextValue ? "allowed" : "denied"}.`,
          userId: member.userId,
          organizationId,
        },
      });
    }
  });

  return {
    success: true,
    message: `${member.user.name || member.user.email || "Member"} app privileges updated.`,
  };
}

export async function getPrivilegeAuditLog(
  actorId: string,
  organizationId: string,
  take = 12
): Promise<PrivilegeAuditItem[]> {
  if (!(await isOrganizationCommander(actorId, organizationId))) {
    throw new ForbiddenError("Only commanders can view privilege audit logs");
  }

  const items = await prisma.activityFeedItem.findMany({
    where: {
      organizationId,
      type: {
        in: ["organization_member_privilege_updated", "organization_member_role_updated"],
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return items.map((item) => ({
    id: item.id,
    type: item.type as "organization_member_privilege_updated" | "organization_member_role_updated",
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    targetUserId: item.userId,
    targetUserName: item.user?.name || null,
    targetUserEmail: item.user?.email || null,
  }));
}

export type CustomRankTemplate = {
  id: string;
  name: string;
  description: string | null;
  baseRole: OrganizationMemberRole;
  position: number;
  assignedMemberCount: number;
  appPrivileges: Record<AppPrivilegeAction, boolean | null>;
};

type CustomRankUpsertInput = {
  name: string;
  description?: string | null;
  baseRole: OrganizationMemberRole;
  position?: number;
  appPrivileges?: AppPrivilegeUpdateInput;
};

type CustomRankUpdateInput = {
  name?: string;
  description?: string | null;
  baseRole?: OrganizationMemberRole;
  position?: number;
  appPrivileges?: AppPrivilegeUpdateInput;
};

async function assertCustomRankManager(actorId: string, organizationId: string) {
  const [isCommander, isAdmin] = await Promise.all([
    isOrganizationCommander(actorId, organizationId),
    isSiteAdmin(actorId),
  ]);

  if (!isCommander && !isAdmin) {
    throw new ForbiddenError("Only commanders and above can manage custom rank structures");
  }

  return { isAdmin };
}

function mapRankPrivileges(
  appPrivileges: Partial<Record<AppPrivilegeAction, boolean | null>> | null | undefined
) {
  return {
    editOrganization: appPrivileges?.editOrganization ?? null,
    inviteMembers: appPrivileges?.inviteMembers ?? null,
    createOperation: appPrivileges?.createOperation ?? null,
    editOperation: appPrivileges?.editOperation ?? null,
    assignRoles: appPrivileges?.assignRoles ?? null,
    inviteOrganizations: appPrivileges?.inviteOrganizations ?? null,
    viewPrivateOperations: appPrivileges?.viewPrivateOperations ?? null,
    postAfterActionReports: appPrivileges?.postAfterActionReports ?? null,
    manageChannels: appPrivileges?.manageChannels ?? null,
  } satisfies Record<AppPrivilegeAction, boolean | null>;
}

function extractPrivilegeUpdates(updates?: AppPrivilegeUpdateInput) {
  const data: Record<string, boolean | null> = {};
  for (const action of APP_PRIVILEGE_ACTIONS) {
    if (typeof updates?.[action] === "boolean") {
      data[action] = updates[action] ?? null;
    }
  }
  return data;
}

export async function listCustomRankTemplates(
  actorId: string,
  organizationId: string
): Promise<CustomRankTemplate[]> {
  await assertCustomRankManager(actorId, organizationId);

  const ranks = await prisma.organizationCustomRank.findMany({
    where: { organizationId },
    include: {
      appPrivileges: true,
      _count: {
        select: { members: true },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return ranks.map((rank) => ({
    id: rank.id,
    name: rank.name,
    description: rank.description,
    baseRole: rank.baseRole,
    position: rank.position,
    assignedMemberCount: rank._count.members,
    appPrivileges: mapRankPrivileges(rank.appPrivileges),
  }));
}

export async function createCustomRankTemplate(
  actorId: string,
  organizationId: string,
  input: CustomRankUpsertInput
) {
  await assertCustomRankManager(actorId, organizationId);

  const name = input.name.trim();
  if (!name) {
    throw new ValidationError("Rank name is required");
  }

  const privilegeData = extractPrivilegeUpdates(input.appPrivileges);

  const created = await prisma.organizationCustomRank.create({
    data: {
      organizationId,
      createdById: actorId,
      name,
      description: input.description?.trim() || null,
      baseRole: input.baseRole,
      position: input.position ?? 0,
      appPrivileges: {
        create: privilegeData,
      },
    },
    include: {
      appPrivileges: true,
      _count: {
        select: { members: true },
      },
    },
  });

  await prisma.activityFeedItem.create({
    data: {
      type: "organization_member_privilege_updated",
      title: `Custom rank created: ${created.name}`,
      body: `Leadership created rank template ${created.name} (${created.baseRole}).`,
      userId: actorId,
      organizationId,
    },
  });

  return {
    success: true,
    message: `Created custom rank ${created.name}.`,
    rank: {
      id: created.id,
      name: created.name,
      description: created.description,
      baseRole: created.baseRole,
      position: created.position,
      assignedMemberCount: created._count.members,
      appPrivileges: mapRankPrivileges(created.appPrivileges),
    } satisfies CustomRankTemplate,
  };
}

export async function updateCustomRankTemplate(
  actorId: string,
  organizationId: string,
  rankId: string,
  input: CustomRankUpdateInput
) {
  await assertCustomRankManager(actorId, organizationId);

  const existing = await prisma.organizationCustomRank.findUnique({
    where: { id: rankId },
  });

  if (!existing || existing.organizationId !== organizationId) {
    throw new NotFoundError("Rank template not found");
  }

  const data: {
    name?: string;
    description?: string | null;
    baseRole?: OrganizationMemberRole;
    position?: number;
  } = {};

  if (typeof input.name === "string") {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new ValidationError("Rank name cannot be empty");
    }
    data.name = trimmedName;
  }

  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  if (input.baseRole) {
    data.baseRole = input.baseRole;
  }

  if (typeof input.position === "number") {
    data.position = input.position;
  }

  const privilegeData = extractPrivilegeUpdates(input.appPrivileges);

  const updated = await prisma.$transaction(async (tx) => {
    const rank = await tx.organizationCustomRank.update({
      where: { id: rankId },
      data,
      include: {
        appPrivileges: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (Object.keys(privilegeData).length) {
      await tx.organizationCustomRankAppPrivilege.upsert({
        where: { organizationCustomRankId: rankId },
        create: {
          organizationCustomRankId: rankId,
          ...privilegeData,
        },
        update: privilegeData,
      });
    }

    return rank;
  });

  await prisma.activityFeedItem.create({
    data: {
      type: "organization_member_privilege_updated",
      title: `Custom rank updated: ${updated.name}`,
      body: `Leadership updated rank template ${updated.name}.`,
      userId: actorId,
      organizationId,
    },
  });

  return {
    success: true,
    message: `Updated custom rank ${updated.name}.`,
  };
}

export async function deleteCustomRankTemplate(
  actorId: string,
  organizationId: string,
  rankId: string
) {
  await assertCustomRankManager(actorId, organizationId);

  const existing = await prisma.organizationCustomRank.findUnique({
    where: { id: rankId },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  if (!existing || existing.organizationId !== organizationId) {
    throw new NotFoundError("Rank template not found");
  }

  await prisma.organizationCustomRank.delete({ where: { id: rankId } });

  await prisma.activityFeedItem.create({
    data: {
      type: "organization_member_privilege_updated",
      title: `Custom rank removed: ${existing.name}`,
      body: `${existing._count.members} member(s) were detached from this template.`,
      userId: actorId,
      organizationId,
    },
  });

  return {
    success: true,
    message: `Deleted custom rank ${existing.name}.`,
  };
}

export async function applyCustomRankTemplateToMembers(
  actorId: string,
  organizationId: string,
  rankId: string,
  memberIds: string[]
) {
  const { isAdmin } = await assertCustomRankManager(actorId, organizationId);

  if (!memberIds.length) {
    throw new ValidationError("Select at least one member to apply a rank");
  }

  const rank = await prisma.organizationCustomRank.findUnique({
    where: { id: rankId },
    include: { appPrivileges: true },
  });

  if (!rank || rank.organizationId !== organizationId) {
    throw new NotFoundError("Rank template not found");
  }

  const [members, actorMembership] = await Promise.all([
    prisma.organizationMember.findMany({
      where: {
        organizationId,
        id: { in: Array.from(new Set(memberIds)) },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: actorId, organizationId } },
    }),
  ]);

  if (members.length !== Array.from(new Set(memberIds)).length) {
    throw new ValidationError("Some selected members no longer exist in this organization");
  }

  if (!isAdmin && !actorMembership) {
    throw new ForbiddenError("You must be a member of this organization");
  }

  if (!isAdmin && actorMembership) {
    for (const member of members) {
      if (ROLE_POWER[member.role] >= ROLE_POWER[actorMembership.role] && member.userId !== actorId) {
        throw new ForbiddenError("You cannot update one or more members with equal or higher rank");
      }
    }

    if (ROLE_POWER[rank.baseRole] >= ROLE_POWER[actorMembership.role]) {
      throw new ForbiddenError("You cannot apply a rank template with a role equal to or higher than your own");
    }
  }

  const privilegeData = mapRankPrivileges(rank.appPrivileges);

  await prisma.$transaction(async (tx) => {
    for (const member of members) {
      await tx.organizationMember.update({
        where: { id: member.id },
        data: {
          role: rank.baseRole,
          title: rank.name,
          customRankId: rank.id,
        },
      });

      await tx.organizationMemberAppPrivilege.upsert({
        where: { organizationMemberId: member.id },
        create: {
          organizationMemberId: member.id,
          ...privilegeData,
        },
        update: privilegeData,
      });

      await tx.activityFeedItem.create({
        data: {
          type: "organization_member_role_updated",
          title: `${member.user.name || member.user.email || "Member"} assigned rank ${rank.name}`,
          body: `Role set to ${rank.baseRole} with template privileges applied.`,
          userId: member.userId,
          organizationId,
        },
      });
    }
  });

  return {
    success: true,
    message: `Applied ${rank.name} to ${members.length} member(s).`,
  };
}

/**
 * Update a member's role with permission checks
 */
export async function updateMemberRole(
  actorId: string,
  organizationId: string,
  memberId: string,
  newRole: string
): Promise<{ success: boolean; message: string }> {
  // Verify actor has privilege to manage members
  const isOfficer = await isOrganizationOfficer(actorId, organizationId);
  const isAdmin = await isSiteAdmin(actorId);

  if (!isOfficer && !isAdmin) {
    throw new ForbiddenError(
      "Only officers and admins can change member roles. Contact your organization leadership."
    );
  }

  // Validate the new role
  const validRoles: OrganizationMemberRole[] = [
    "OWNER",
    "OFFICER",
    "COMMANDER",
    "TEAM_LEADER",
    "MEMBER",
    "GUEST",
  ];
  if (!validRoles.includes(newRole as OrganizationMemberRole)) {
    throw new ValidationError(`Invalid role: ${newRole}`);
  }

  // Get the member to update
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!member) {
    throw new NotFoundError("Member not found");
  }

  if (member.organizationId !== organizationId) {
    throw new ForbiddenError("Member does not belong to this organization");
  }

  const actorMembership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId } },
  });

  if (!actorMembership && !isAdmin) {
    throw new ForbiddenError("You must be a member of this organization");
  }

  if (!isAdmin && actorMembership) {
    if (ROLE_POWER[member.role] >= ROLE_POWER[actorMembership.role] && member.userId !== actorId) {
      throw new ForbiddenError("You cannot change the role of an equal or higher-ranked member");
    }

    if (
      newRole !== member.role &&
      ROLE_POWER[newRole as OrganizationMemberRole] >= ROLE_POWER[actorMembership.role]
    ) {
      throw new ForbiddenError("You cannot assign a role equal to or higher than your own");
    }
  }

  // Prevent removing OWNER role unless actor is OWNER or SITE_ADMIN
  if (member.role === "OWNER" && newRole !== "OWNER") {
    if (actorMembership?.role !== "OWNER" && !isAdmin) {
      throw new ForbiddenError("Cannot remove OWNER role");
    }
  }

  // Prevent assigning OWNER role unless actor is OWNER or SITE_ADMIN
  if (newRole === "OWNER") {
    if (actorMembership?.role !== "OWNER" && !isAdmin) {
      throw new ForbiddenError("Only owners can assign the OWNER role");
    }
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  // Update the member role and emit social signals.
  await prisma.$transaction(async (tx) => {
    await tx.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole as OrganizationMemberRole },
    });

    await tx.activityFeedItem.create({
      data: {
        type: "organization_member_role_updated",
        title: `${member.user.name || member.user.email || "Member"} is now ${newRole}`,
        body: `Membership role updated in ${organization?.name || "the organization"}.`,
        userId: member.userId,
        organizationId,
      },
    });

    if (member.userId !== actorId) {
      await tx.notification.create({
        data: {
          userId: member.userId,
          type: "SYSTEM",
          title: `Your organization role changed to ${newRole}`,
          body: `Your access level was updated in ${organization?.name || "your organization"}.`,
          link: `/organizations/${organizationId}/members-privileges`,
        },
      });
    }
  });

  return {
    success: true,
    message: `${member.userId === actorId ? "You have been" : `${member.user.name || "Member"} has been`} updated to ${newRole}.`,
  };
}

/**
 * Remove a member from the organization
 */
export async function removeMemberFromOrganization(
  actorId: string,
  organizationId: string,
  memberId: string
): Promise<{ success: boolean; message: string }> {
  // Only officers and admins can remove members
  const isOfficer = await isOrganizationOfficer(actorId, organizationId);
  const isAdmin = await isSiteAdmin(actorId);

  if (!isOfficer && !isAdmin) {
    throw new ForbiddenError(
      "Only officers can remove members. Contact your organization leadership."
    );
  }

  // Get the member to remove
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!member) {
    throw new NotFoundError("Member not found");
  }

  if (member.organizationId !== organizationId) {
    throw new ForbiddenError("Member does not belong to this organization");
  }

  const actorMembership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId } },
  });

  if (!actorMembership && !isAdmin) {
    throw new ForbiddenError("You must be a member of this organization");
  }

  if (!isAdmin && actorMembership) {
    if (ROLE_POWER[member.role] >= ROLE_POWER[actorMembership.role]) {
      throw new ForbiddenError("You cannot remove an equal or higher-ranked member");
    }
  }

  // Prevent removing OWNER unless actor is OWNER or SITE_ADMIN
  if (member.role === "OWNER") {
    if (actorMembership?.role !== "OWNER" && !isAdmin) {
      throw new ForbiddenError("Cannot remove the organization owner");
    }
  }

  // Cannot remove yourself
  if (member.userId === actorId && !isAdmin) {
    throw new ForbiddenError("You cannot remove yourself from the organization");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.organizationMember.delete({
      where: { id: memberId },
    });

    await tx.activityFeedItem.create({
      data: {
        type: "organization_member_removed",
        title: `${member.user.name || member.user.email || "Member"} removed from organization`,
        body: `${member.user.name || member.user.email || "A member"} is no longer part of ${organization?.name || "the organization"}.`,
        userId: member.userId,
        organizationId,
      },
    });

    await tx.notification.create({
      data: {
        userId: member.userId,
        type: "SYSTEM",
        title: `You were removed from ${organization?.name || "an organization"}`,
        body: "Your membership and related privileges were removed.",
        link: "/organizations",
      },
    });
  });

  return {
    success: true,
    message: `${member.user.name || member.user.email} has been removed from the organization.`,
  };
}

/**
 * Get role permission details for display/education
 */
export async function getRolePermissionDetails(role: OrganizationMemberRole): Promise<{
  role: string;
  permissions: string[];
  description: string;
}> {
  const roleDetails: Record<
    OrganizationMemberRole,
    { permissions: string[]; description: string }
  > = {
    OWNER: {
      permissions: [
        "Edit organization settings",
        "Invite members",
        "Create operations",
        "Edit operations",
        "Assign member roles",
        "Invite other organizations",
        "Post after-action reports",
        "Remove members",
      ],
      description:
        "Full organizational control. Used for founder/leader of the organization.",
    },
    OFFICER: {
      permissions: [
        "Invite members",
        "Create operations",
        "Edit operations",
        "Assign member roles",
        "Post after-action reports",
        "Manage organization operations",
      ],
      description: "Leadership role with broad operational authority.",
    },
    COMMANDER: {
      permissions: [
        "Create operations",
        "Edit operations",
        "Assign roles within operations",
        "Post after-action reports",
        "Manage subordinates",
      ],
      description: "Tactical leader focused on operation execution and team management.",
    },
    TEAM_LEADER: {
      permissions: [
        "Create operations",
        "Assign team members to operations",
        "View private operations",
      ],
      description: "Team-level leadership with limited cross-organizational scope.",
    },
    MEMBER: {
      permissions: ["View private operations", "Participate in missions"],
      description: "Standard member with participation rights.",
    },
    GUEST: {
      permissions: ["View public operations"],
      description: "Limited access. Can view public content only.",
    },
  };

  const details = roleDetails[role];
  return {
    role,
    permissions: details.permissions,
    description: details.description,
  };
}
