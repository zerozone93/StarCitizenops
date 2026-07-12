import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createInventoryLocation } from "@/server/inventory-industrial";

const createLocationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createLocationSchema.parse(await request.json());
    const location = await createInventoryLocation(session.user.id, body);
    return apiSuccess({ location }, 201);
  } catch (error) {
    return apiError(error);
  }
}
