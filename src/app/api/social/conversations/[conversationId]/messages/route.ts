import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { listConversationMessages, sendMessage } from "@/server/social";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const messages = await listConversationMessages(session.user.id, conversationId);
    return apiSuccess({ messages });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const body = await request.json();
    await sendMessage(session.user.id, conversationId, String(body?.body || ""));
    const messages = await listConversationMessages(session.user.id, conversationId);

    return apiSuccess({ messages });
  } catch (error) {
    return apiError(error);
  }
}
