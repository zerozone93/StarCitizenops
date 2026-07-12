import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getPrivilegeAuditLog } from "@/server/member-privilege-management";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const takeParam = Number.parseInt(searchParams.get("take") || "12", 10);
    const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 30) : 12;

    const audit = await getPrivilegeAuditLog(session.user.id, organizationId, take);
    return apiSuccess(audit);
  } catch (error) {
    return apiError(error);
  }
}
