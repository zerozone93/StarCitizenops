import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runMissionIntelligence } from "@/server/mission-intelligence";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if enabled
    if (process.env.MISSION_INTELLIGENCE_ENABLED !== "true") {
      return NextResponse.json({ status: "disabled" });
    }

    // Check minimum interval
    const minDays = parseInt(process.env.MISSION_INTELLIGENCE_MIN_INTERVAL_DAYS ?? "6", 10);
    const lastSuccessfulRun = await prisma.missionIntelligenceRun.findFirst({
      where: { status: { in: ["SUCCESS", "PARTIAL_SUCCESS"] } },
      orderBy: { completedAt: "desc" },
    });

    if (lastSuccessfulRun?.completedAt) {
      const daysSince = (Date.now() - lastSuccessfulRun.completedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < minDays) {
        return NextResponse.json({ status: "skipped", reason: `Last run was ${daysSince.toFixed(1)} days ago (minimum ${minDays} days)` });
      }
    }

    const result = await runMissionIntelligence();
    return NextResponse.json({ status: "success", ...result });
  } catch (error) {
    return apiError(error);
  }
}
