import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { listOnlineMembers } from "@/server/social";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await listOnlineMembers(session.user.id);
    return apiSuccess({ members });
  } catch (error) {
    return apiError(error);
  }
}
