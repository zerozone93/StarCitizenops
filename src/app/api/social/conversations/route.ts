import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createDirectConversation, deleteDirectConversation, listUserConversations } from "@/server/social";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await listUserConversations(session.user.id);
    return apiSuccess({ userId: session.user.id, conversations });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      targetUserId?: string;
      initialMessage?: string;
    };

    const conversation = await createDirectConversation(
      session.user.id,
      String(body?.targetUserId || ""),
      body?.initialMessage
    );

    return apiSuccess({ conversation }, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { conversationId?: string };
    const result = await deleteDirectConversation(
      session.user.id,
      String(body?.conversationId || "")
    );

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
