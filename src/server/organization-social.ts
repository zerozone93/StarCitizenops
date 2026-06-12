import type {
  OrganizationInviteStatus,
  OrganizationJoinRequestStatus,
  OrganizationMemberRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { isOrganizationOfficer, isSiteAdmin } from "@/server/permissions";

const MANAGER_ROLES: OrganizationMemberRole[] = ["OWNER", "OFFICER"];
const BULLETIN_ALLOWED_ROLES: OrganizationMemberRole[] = [
  "OWNER",
  "OFFICER",
  "COMMANDER",
];
const CHAT_BULLETIN_MAX_LENGTH = 2000;
const LEADERSHIP_BULLETIN_ROLES: OrganizationMemberRole[] = ["OWNER", "OFFICER", "COMMANDER"];

async function getOrganizationMembership(userId: string, organizationId: string) {
  return prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
}

async function ensureOrganizationExists(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, ownerId: true, visibility: true },
  });

  if (!organization) {
    throw new NotFoundError("Organization not found");
  }

  return organization;
}

async function ensureCanManageGrowth(actorId: string, organizationId: string) {
  const [isAdmin, isOfficer] = await Promise.all([
    isSiteAdmin(actorId),
    isOrganizationOfficer(actorId, organizationId),
  ]);

  if (!isAdmin && !isOfficer) {
    throw new ForbiddenError("Only officers and owners can manage invites and join requests");
  }

  return { isAdmin };
}

async function notifyOrganizationManagers(
  organizationId: string,
  title: string,
  body: string,
  link: string
) {
  const managers = await prisma.organizationMember.findMany({
    where: { organizationId, role: { in: MANAGER_ROLES } },
    select: { userId: true },
  });

  if (!managers.length) return;

  await prisma.notification.createMany({
    data: managers.map((manager) => ({
      userId: manager.userId,
      type: "SYSTEM",
      title,
      body,
      link,
    })),
    skipDuplicates: false,
  });
}

export async function createOrganizationInvite(
  actorId: string,
  organizationId: string,
  input: { email: string; role: OrganizationMemberRole; message?: string }
) {
  await ensureCanManageGrowth(actorId, organizationId);
  const organization = await ensureOrganizationExists(organizationId);

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ValidationError("Email is required");
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  });

  if (invitedUser) {
    const membership = await getOrganizationMembership(invitedUser.id, organizationId);
    if (membership) {
      throw new ConflictError("That user is already a member of this organization");
    }
  }

  const pendingInvite = await prisma.organizationInvite.findFirst({
    where: {
      organizationId,
      email: normalizedEmail,
      status: "PENDING",
    },
  });

  if (pendingInvite) {
    throw new ConflictError("A pending invite already exists for that email");
  }

  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId,
      inviterId: actorId,
      invitedUserId: invitedUser?.id,
      email: normalizedEmail,
      role: input.role,
      message: input.message?.trim() || null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
    include: {
      invitedUser: { select: { id: true } },
    },
  });

  await prisma.activityFeedItem.create({
    data: {
      type: "organization_invite_created",
      title: `Invite sent to ${normalizedEmail}`,
      body: `Invitation to join ${organization.name} as ${input.role}.`,
      organizationId,
      userId: actorId,
    },
  });

  if (invite.invitedUser?.id) {
    await prisma.notification.create({
      data: {
        userId: invite.invitedUser.id,
        type: "ORG_INVITE",
        title: `Invitation to join ${organization.name}`,
        body: input.message?.trim() || `You were invited to join as ${input.role}.`,
        link: "/organizations",
      },
    });
  }

  return invite;
}

export async function acceptOrganizationInvite(userId: string, inviteId: string) {
  const invite = await prisma.organizationInvite.findUnique({
    where: { id: inviteId },
    include: {
      organization: { select: { name: true } },
      invitedUser: { select: { id: true } },
    },
  });

  if (!invite || invite.status !== "PENDING") {
    throw new NotFoundError("Invite not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user?.email || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new ForbiddenError("This invite is not assigned to your account");
  }

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });
    throw new ForbiddenError("This invite has expired");
  }

  const existingMembership = await getOrganizationMembership(userId, invite.organizationId);

  await prisma.$transaction(async (tx) => {
    if (!existingMembership) {
      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: invite.organizationId,
          role: invite.role,
        },
      });
    }

    await tx.organizationInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        invitedUserId: userId,
        respondedAt: new Date(),
      },
    });

    await tx.activityFeedItem.create({
      data: {
        type: "organization_member_joined",
        title: `${user.name || user.email} joined ${invite.organization.name}`,
        body: `Accepted an organization invite as ${invite.role}.`,
        organizationId: invite.organizationId,
        userId,
      },
    });

    await tx.notification.create({
      data: {
        userId: invite.inviterId,
        type: "SYSTEM",
        title: `${user.name || user.email} accepted the organization invite`,
        body: `${invite.organization.name} has a new ${invite.role.toLowerCase().replaceAll("_", " ")}.`,
        link: `/organizations/${invite.organizationId}`,
      },
    });
  });
}

export async function declineOrganizationInvite(userId: string, inviteId: string) {
  const invite = await prisma.organizationInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.status !== "PENDING") {
    throw new NotFoundError("Invite not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user?.email || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new ForbiddenError("This invite is not assigned to your account");
  }

  await prisma.organizationInvite.update({
    where: { id: invite.id },
    data: { status: "DECLINED", invitedUserId: userId, respondedAt: new Date() },
  });
}

export async function cancelOrganizationInvite(actorId: string, inviteId: string) {
  const invite = await prisma.organizationInvite.findUnique({
    where: { id: inviteId },
    include: { organization: { select: { name: true } } },
  });

  if (!invite) {
    throw new NotFoundError("Invite not found");
  }

  await ensureCanManageGrowth(actorId, invite.organizationId);

  await prisma.organizationInvite.update({
    where: { id: invite.id },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });

  await prisma.activityFeedItem.create({
    data: {
      type: "organization_invite_cancelled",
      title: `Invite cancelled for ${invite.email}`,
      body: `Invitation to ${invite.organization.name} was cancelled.`,
      organizationId: invite.organizationId,
      userId: actorId,
    },
  });
}

export async function createJoinRequest(
  userId: string,
  organizationId: string,
  input: {
    applicantHandle: string;
    preferredRole: string;
    weeklyAvailability: string;
    reasonToJoin: string;
    message?: string;
  }
) {
  const organization = await ensureOrganizationExists(organizationId);
  const membership = await getOrganizationMembership(userId, organizationId);
  if (membership) {
    throw new ConflictError("You are already a member of this organization");
  }

  const pendingRequest = await prisma.organizationJoinRequest.findFirst({
    where: { organizationId, userId, status: "PENDING" },
  });
  if (pendingRequest) {
    throw new ConflictError("You already have a pending join request for this organization");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  const pendingInvite = user?.email
    ? await prisma.organizationInvite.findFirst({
        where: {
          organizationId,
          email: user.email.toLowerCase(),
          status: "PENDING",
        },
      })
    : null;

  if (pendingInvite) {
    throw new ConflictError("You already have a pending invite for this organization");
  }

  const request = await prisma.organizationJoinRequest.create({
    data: {
      organizationId,
      userId,
      applicantHandle: input.applicantHandle.trim(),
      preferredRole: input.preferredRole.trim(),
      weeklyAvailability: input.weeklyAvailability.trim(),
      reasonToJoin: input.reasonToJoin.trim(),
      message: input.message?.trim() || null,
    },
  });

  await prisma.activityFeedItem.create({
    data: {
      type: "organization_join_request_created",
      title: `${user?.name || user?.email || "A player"} requested to join ${organization.name}`,
      body: `Requested role: ${input.preferredRole.trim()} • Availability: ${input.weeklyAvailability.trim()}`,
      organizationId,
      userId,
    },
  });

  await notifyOrganizationManagers(
    organizationId,
    `New join request for ${organization.name}`,
    `${user?.name || user?.email || "A player"} requested membership.`,
    `/organizations/${organizationId}`
  );

  return request;
}

export async function approveJoinRequest(
  actorId: string,
  requestId: string,
  role: OrganizationMemberRole = "MEMBER"
) {
  const request = await prisma.organizationJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      organization: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!request || request.status !== "PENDING") {
    throw new NotFoundError("Join request not found");
  }

  await ensureCanManageGrowth(actorId, request.organizationId);

  const existingMembership = await getOrganizationMembership(request.userId, request.organizationId);

  await prisma.$transaction(async (tx) => {
    if (!existingMembership) {
      await tx.organizationMember.create({
        data: {
          userId: request.userId,
          organizationId: request.organizationId,
          role,
        },
      });
    }

    await tx.organizationJoinRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedById: actorId,
        reviewedAt: new Date(),
      },
    });

    await tx.activityFeedItem.create({
      data: {
        type: "organization_join_request_approved",
        title: `${request.user.name || request.user.email} joined ${request.organization.name}`,
        body: `Join request approved with role ${role}.`,
        organizationId: request.organizationId,
        userId: request.userId,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        type: "SYSTEM",
        title: `Join request approved for ${request.organization.name}`,
        body: `You have been added as ${role.toLowerCase().replaceAll("_", " ")}.`,
        link: `/organizations/${request.organizationId}`,
      },
    });
  });
}

export async function rejectJoinRequest(
  actorId: string,
  requestId: string,
  reason?: string
) {
  const request = await prisma.organizationJoinRequest.findUnique({
    where: { id: requestId },
    include: { organization: { select: { name: true } } },
  });

  if (!request || request.status !== "PENDING") {
    throw new NotFoundError("Join request not found");
  }

  await ensureCanManageGrowth(actorId, request.organizationId);

  await prisma.$transaction(async (tx) => {
    await tx.organizationJoinRequest.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        reviewedById: actorId,
        reviewedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        type: "SYSTEM",
        title: `Join request declined for ${request.organization.name}`,
        body: reason?.trim() || "Organization leadership declined your request.",
        link: "/organizations",
      },
    });
  });
}

export async function cancelJoinRequest(userId: string, requestId: string) {
  const request = await prisma.organizationJoinRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    throw new NotFoundError("Join request not found");
  }

  if (request.userId !== userId) {
    throw new ForbiddenError("You can only cancel your own join request");
  }

  await prisma.organizationJoinRequest.update({
    where: { id: request.id },
    data: { status: "CANCELLED", reviewedAt: new Date() },
  });
}

export async function createOrganizationBulletin(
  actorId: string,
  organizationId: string,
  input: { title: string; body: string }
) {
  const membership = await getOrganizationMembership(actorId, organizationId);
  const isAdmin = await isSiteAdmin(actorId);

  if (!membership && !isAdmin) {
    throw new ForbiddenError("Only organization leadership can post bulletins");
  }

  if (membership && !BULLETIN_ALLOWED_ROLES.includes(membership.role)) {
    throw new ForbiddenError("Only organization leadership can post bulletins");
  }

  const organization = await ensureOrganizationExists(organizationId);
  const trimmedTitle = input.title.trim();
  const trimmedBody = input.body.trim();

  const item = await prisma.activityFeedItem.create({
    data: {
      type: "organization_bulletin",
      title: trimmedTitle,
      body: trimmedBody,
      organizationId,
      userId: actorId,
    },
  });

  if (membership && LEADERSHIP_BULLETIN_ROLES.includes(membership.role)) {
    let commandBriefingChannel = await prisma.conversation.findFirst({
      where: {
        organizationId,
        isChannel: true,
        title: "Command Briefing",
      },
      select: { id: true },
    });

    if (!commandBriefingChannel) {
      commandBriefingChannel = await prisma.conversation.create({
        data: {
          organizationId,
          isChannel: true,
          visibility: "PRIVATE",
          title: "Command Briefing",
          description: "Leadership-only channel for strategic planning and high-level decisions.",
          createdById: actorId,
        },
        select: { id: true },
      });
    }

    const leadershipMessage = `Leadership bulletin: ${trimmedTitle}\n\n${trimmedBody}`.slice(
      0,
      CHAT_BULLETIN_MAX_LENGTH
    );

    await prisma.message.create({
      data: {
        conversationId: commandBriefingChannel.id,
        senderId: actorId,
        body: leadershipMessage,
      },
    });
  }

  await notifyOrganizationManagers(
    organizationId,
    `New bulletin in ${organization.name}`,
    trimmedTitle,
    `/organizations/${organizationId}`
  );

  return item;
}

export async function listUserPendingOrganizationInvites(userId: string, email?: string | null) {
  const normalizedEmail = email?.toLowerCase() ?? null;
  return prisma.organizationInvite.findMany({
    where: {
      status: "PENDING",
      OR: [
        { invitedUserId: userId },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    },
    include: {
      organization: { select: { id: true, name: true, tag: true } },
      inviter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listUserJoinRequests(userId: string) {
  return prisma.organizationJoinRequest.findMany({
    where: { userId },
    include: {
      organization: { select: { id: true, name: true, tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrganizationPendingInvites(organizationId: string) {
  return prisma.organizationInvite.findMany({
    where: { organizationId, status: "PENDING" },
    include: {
      inviter: { select: { id: true, name: true, email: true } },
      invitedUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrganizationPendingJoinRequests(organizationId: string) {
  return prisma.organizationJoinRequest.findMany({
    where: { organizationId, status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true, starCitizenHandle: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function isPendingInviteStatus(status: OrganizationInviteStatus) {
  return status === "PENDING";
}

export function isPendingJoinRequestStatus(status: OrganizationJoinRequestStatus) {
  return status === "PENDING";
}
