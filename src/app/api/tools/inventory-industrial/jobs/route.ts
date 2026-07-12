import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { IndustrialJobType } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createIndustrialJob } from "@/server/inventory-industrial";

const createJobSchema = z.object({
  title: z.string().min(1),
  jobType: z.nativeEnum(IndustrialJobType),
  priority: z.number().int().min(1).max(5),
  targetItemId: z.string().cuid().optional(),
  quantityTarget: z.number().int().nonnegative().optional(),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createJobSchema.parse(await request.json());
    const job = await createIndustrialJob(session.user.id, body);
    return apiSuccess({ job }, 201);
  } catch (error) {
    return apiError(error);
  }
}
