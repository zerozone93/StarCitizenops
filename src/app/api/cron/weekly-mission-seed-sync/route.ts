import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { syncRealScMissions } from "@/server/real-sc-missions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.WEEKLY_MISSION_SEED_SYNC_ENABLED !== "true") {
      return NextResponse.json({ status: "disabled" });
    }

    const missionSyncResult = await syncRealScMissions(prisma);

    return NextResponse.json({
      status: "success",
      refreshType: "weekly-mission-seed-sync",
      missionSyncResult,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
