import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { listInventoryIndustrialOrganizations } from "@/server/inventory-industrial";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await listInventoryIndustrialOrganizations(session.user.id);
    return apiSuccess({ organizations });
  } catch (error) {
    return apiError(error);
  }
}
