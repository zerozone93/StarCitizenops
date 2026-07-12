import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getInventoryIndustrialDashboard } from "@/server/inventory-industrial";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboard = await getInventoryIndustrialDashboard(session.user.id);
    return apiSuccess({ organizations: [dashboard.organization] });
  } catch (error) {
    return apiError(error);
  }
}
