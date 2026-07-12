import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateInventoryItem } from "@/server/inventory-industrial";

const updateItemSchema = z.object({
  quantity: z.number().int().nonnegative().optional(),
  locationId: z.string().cuid().nullable().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const body = updateItemSchema.parse(await request.json());
    const item = await updateInventoryItem(session.user.id, itemId, body);
    return apiSuccess({ item });
  } catch (error) {
    return apiError(error);
  }
}
