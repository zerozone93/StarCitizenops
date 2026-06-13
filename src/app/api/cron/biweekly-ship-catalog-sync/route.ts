import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { refreshStarCitizenShipCatalog } from "@/lib/star-citizen-ship-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.BIWEEKLY_SHIP_CATALOG_SYNC_ENABLED === "false") {
      return NextResponse.json({ status: "disabled" });
    }

    const result = await refreshStarCitizenShipCatalog();

    return NextResponse.json({
      status: "success",
      refreshType: "biweekly-ship-catalog-sync",
      shipCatalogCount: result.count,
      refreshedAt: result.refreshedAt,
    });
  } catch (error) {
    return apiError(error);
  }
}
