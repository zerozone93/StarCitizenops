import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { runMissionIntelligence } from "@/server/mission-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.WEEKLY_DATA_REFRESH_ENABLED !== "true") {
      return NextResponse.json({ status: "disabled" });
    }

    let missionIntelligenceResult: unknown = {
      status: "skipped",
      reason: "MISSION_INTELLIGENCE_ENABLED is not true",
    };

    if (process.env.MISSION_INTELLIGENCE_ENABLED === "true") {
      missionIntelligenceResult = await runMissionIntelligence();
    }

    const [missionTemplateCount, latestMissionIntelRun] = await Promise.all([
      prisma.missionTemplate.count(),
      prisma.missionIntelligenceRun.findFirst({ orderBy: { startedAt: "desc" } }),
    ]);

    return NextResponse.json({
      status: "success",
      refreshType: "weekly-live-refresh",
      missionIntelligenceResult,
      missionTemplateCount,
      latestMissionIntelligenceRun: latestMissionIntelRun
        ? {
            id: latestMissionIntelRun.id,
            status: latestMissionIntelRun.status,
            startedAt: latestMissionIntelRun.startedAt,
            completedAt: latestMissionIntelRun.completedAt,
            sourcesChecked: latestMissionIntelRun.sourcesChecked,
            itemsFound: latestMissionIntelRun.itemsFound,
            newItemsCreated: latestMissionIntelRun.newItemsCreated,
            suggestionsCreated: latestMissionIntelRun.suggestionsCreated,
          }
        : null,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
