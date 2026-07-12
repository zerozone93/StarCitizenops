import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createRefineryRun } from "@/server/inventory-industrial";

const createRefineryRunSchema = z.object({
  inputItemId: z.string().cuid(),
  outputItemId: z.string().cuid().optional(),
  intakeQuantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createRefineryRunSchema.parse(await request.json());
    const run = await createRefineryRun(session.user.id, body);
    return apiSuccess({ run }, 201);
  } catch (error) {
    return apiError(error);
  }
}
