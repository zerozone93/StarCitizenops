import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getInventoryIndustrialDashboard } from "@/server/inventory-industrial";

const dashboardQuerySchema = z.object({
  organizationId: z.string().cuid(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedQuery = dashboardQuerySchema.parse({
      organizationId: request.nextUrl.searchParams.get("organizationId"),
    });

    const dashboard = await getInventoryIndustrialDashboard(session.user.id, parsedQuery.organizationId);
    return apiSuccess(dashboard);
  } catch (error) {
    return apiError(error);
  }
}
