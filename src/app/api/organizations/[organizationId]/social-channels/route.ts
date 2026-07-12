import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  createOrganizationChannel,
  listOrganizationChannelSettings,
  updateOrganizationChannelVisibility,
} from "@/server/social";

const createChannelSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

const updateVisibilitySchema = z.object({
  conversationId: z.string().cuid(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
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
    const channels = await listOrganizationChannelSettings(session.user.id, organizationId);
    return apiSuccess(channels);
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
    const input = createChannelSchema.parse(body);

    const channel = await createOrganizationChannel(session.user.id, organizationId, input);
    return apiSuccess(channel, 201);
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
    const input = updateVisibilitySchema.parse(body);

    const updated = await updateOrganizationChannelVisibility(
      session.user.id,
      organizationId,
      input.conversationId,
      input.visibility
    );

    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
}
