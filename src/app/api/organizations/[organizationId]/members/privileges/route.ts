import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import {
  getMembersForPrivilegeManagement,
  updateMemberRole,
  removeMemberFromOrganization,
  updateMemberAppPrivileges,
} from "@/server/member-privilege-management";
import { prisma } from "@/lib/prisma";
import { syncMemberRole } from "@/lib/discord";
import { z } from "zod";

const updateRoleSchema = z.object({
  memberId: z.string().cuid(),
  newRole: z.string(),
});

const removeMemberSchema = z.object({
  memberId: z.string().cuid(),
});

const updateAppPrivilegesSchema = z.object({
  memberId: z.string().cuid(),
  appPrivileges: z.object({
    editOrganization: z.boolean().optional(),
    inviteMembers: z.boolean().optional(),
    createOperation: z.boolean().optional(),
    editOperation: z.boolean().optional(),
    assignRoles: z.boolean().optional(),
    inviteOrganizations: z.boolean().optional(),
    viewPrivateOperations: z.boolean().optional(),
    postAfterActionReports: z.boolean().optional(),
    manageChannels: z.boolean().optional(),
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const members = await getMembersForPrivilegeManagement(
      session.user.id,
      organizationId
    );

    return apiSuccess(members);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const { memberId, newRole } = updateRoleSchema.parse(body);

    const result = await updateMemberRole(
      session.user.id,
      organizationId,
      memberId,
      newRole
    );

    // Best-effort Discord role sync when enabled for this organization.
    const [org, memberUser] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          discordRoleSyncEnabled: true,
          discordGuildId: true,
          discordBotToken: true,
        },
      }),
      prisma.organizationMember.findUnique({
        where: { id: memberId },
        select: { user: { select: { discordUserId: true } } },
      }),
    ]);

    if (
      org?.discordRoleSyncEnabled &&
      org.discordGuildId &&
      org.discordBotToken &&
      memberUser?.user.discordUserId
    ) {
      await syncMemberRole(
        org.discordGuildId,
        org.discordBotToken,
        memberUser.user.discordUserId,
        newRole
      ).catch(() => {
        // Non-fatal: role sync should not block privilege updates.
      });
    }

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const { memberId } = removeMemberSchema.parse(body);

    const result = await removeMemberFromOrganization(
      session.user.id,
      organizationId,
      memberId
    );

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const { memberId, appPrivileges } = updateAppPrivilegesSchema.parse(body);

    const result = await updateMemberAppPrivileges(
      session.user.id,
      organizationId,
      memberId,
      appPrivileges
    );

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
