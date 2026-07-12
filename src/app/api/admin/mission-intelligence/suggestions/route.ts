import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listMissionSuggestions } from "@/server/mission-intelligence";
import { canAccessAdminMissionIntelligence } from "@/server/permissions";
import { apiError } from "@/lib/api-response";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessAdminMissionIntelligence(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const suggestions = await listMissionSuggestions(status);
    return NextResponse.json(suggestions);
  } catch (error) {
    return apiError(error);
  }
}
