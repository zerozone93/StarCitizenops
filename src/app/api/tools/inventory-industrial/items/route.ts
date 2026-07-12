import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { InventoryItemCategory } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createInventoryItem } from "@/server/inventory-industrial";

const createItemSchema = z.object({
  locationId: z.string().cuid().optional(),
  name: z.string().min(1),
  category: z.nativeEnum(InventoryItemCategory),
  quantity: z.number().int().nonnegative(),
  unit: z.string().min(1),
  sku: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createItemSchema.parse(await request.json());
    const item = await createInventoryItem(session.user.id, body);
    return apiSuccess({ item }, 201);
  } catch (error) {
    return apiError(error);
  }
}
