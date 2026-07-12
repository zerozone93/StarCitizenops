import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { toggleMessageReaction } from "@/server/social";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const body = await request.json();
    await toggleMessageReaction(session.user.id, messageId, String(body?.emoji || ""));
    return apiSuccess({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
