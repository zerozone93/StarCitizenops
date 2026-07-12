import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { IndustrialJobStatus } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateIndustrialJob } from "@/server/inventory-industrial";

const updateJobSchema = z.object({
  status: z.nativeEnum(IndustrialJobStatus).optional(),
  quantityCompleted: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const body = updateJobSchema.parse(await request.json());
    const job = await updateIndustrialJob(session.user.id, jobId, body);
    return apiSuccess({ job });
  } catch (error) {
    return apiError(error);
  }
}
