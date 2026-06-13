import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type { OrganizationMemberRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  applyCustomRankTemplateToMembers,
  createCustomRankTemplate,
  deleteCustomRankTemplate,
  listCustomRankTemplates,
  updateCustomRankTemplate,
} from "@/server/member-privilege-management";

const appPrivilegesSchema = z
  .object({
    editOrganization: z.boolean().optional(),
    inviteMembers: z.boolean().optional(),
    createOperation: z.boolean().optional(),
    editOperation: z.boolean().optional(),
    assignRoles: z.boolean().optional(),
    inviteOrganizations: z.boolean().optional(),
    viewPrivateOperations: z.boolean().optional(),
    postAfterActionReports: z.boolean().optional(),
    manageChannels: z.boolean().optional(),
  })
  .optional();

const createRankSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).optional(),
  baseRole: z.enum(["OWNER", "OFFICER", "COMMANDER", "TEAM_LEADER", "MEMBER", "GUEST"]),
  position: z.number().int().min(0).max(999).optional(),
  appPrivileges: appPrivilegesSchema,
});

const updateRankActionSchema = z.object({
  action: z.literal("update"),
  rankId: z.string().cuid(),
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(240).optional(),
  baseRole: z.enum(["OWNER", "OFFICER", "COMMANDER", "TEAM_LEADER", "MEMBER", "GUEST"]).optional(),
  position: z.number().int().min(0).max(999).optional(),
  appPrivileges: appPrivilegesSchema,
});

const applyRankActionSchema = z.object({
  action: z.literal("apply"),
  rankId: z.string().cuid(),
  memberIds: z.array(z.string().cuid()).min(1),
});

const patchSchema = z.discriminatedUnion("action", [updateRankActionSchema, applyRankActionSchema]);

const deleteRankSchema = z.object({
  rankId: z.string().cuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const ranks = await listCustomRankTemplates(session.user.id, organizationId);
    return apiSuccess(ranks);
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
    const payload = createRankSchema.parse(body);

    const result = await createCustomRankTemplate(session.user.id, organizationId, {
      name: payload.name,
      description: payload.description,
      baseRole: payload.baseRole as OrganizationMemberRole,
      position: payload.position,
      appPrivileges: payload.appPrivileges,
    });

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
    const payload = patchSchema.parse(body);

    if (payload.action === "apply") {
      const result = await applyCustomRankTemplateToMembers(
        session.user.id,
        organizationId,
        payload.rankId,
        payload.memberIds
      );
      return apiSuccess(result);
    }

    const result = await updateCustomRankTemplate(
      session.user.id,
      organizationId,
      payload.rankId,
      {
        name: payload.name,
        description: payload.description,
        baseRole: payload.baseRole as OrganizationMemberRole | undefined,
        position: payload.position,
        appPrivileges: payload.appPrivileges,
      }
    );

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
    const payload = deleteRankSchema.parse(body);

    const result = await deleteCustomRankTemplate(session.user.id, organizationId, payload.rankId);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
