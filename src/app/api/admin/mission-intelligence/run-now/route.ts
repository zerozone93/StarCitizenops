import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runMissionIntelligenceNow } from "@/server/mission-intelligence";
import { apiError } from "@/lib/api-response";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runMissionIntelligenceNow(session.user.id);
    return NextResponse.json({ status: "success", ...result });
  } catch (error) {
    return apiError(error);
  }
}
