import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResourceTicketType } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createResourceTicket } from "@/server/inventory-industrial";

const createResourceTicketSchema = z.object({
  itemId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unit: z.string().optional(),
  type: z.nativeEnum(ResourceTicketType),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createResourceTicketSchema.parse(await request.json());
    const ticket = await createResourceTicket(session.user.id, body);
    return apiSuccess({ ticket }, 201);
  } catch (error) {
    return apiError(error);
  }
}
