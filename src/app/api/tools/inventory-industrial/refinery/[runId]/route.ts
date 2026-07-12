import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RefineryRunStatus } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateRefineryRun } from "@/server/inventory-industrial";

const updateRefineryRunSchema = z.object({
  status: z.nativeEnum(RefineryRunStatus).optional(),
  outputQuantity: z.number().int().nonnegative().optional(),
  wasteQuantity: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;
    const body = updateRefineryRunSchema.parse(await request.json());
    const run = await updateRefineryRun(session.user.id, runId, body);
    return apiSuccess({ run });
  } catch (error) {
    return apiError(error);
  }
}
