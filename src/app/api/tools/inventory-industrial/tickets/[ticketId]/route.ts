import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResourceTicketStatus } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateResourceTicket } from "@/server/inventory-industrial";

const updateResourceTicketSchema = z.object({
  status: z.nativeEnum(ResourceTicketStatus).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId } = await params;
    const body = updateResourceTicketSchema.parse(await request.json());
    const ticket = await updateResourceTicket(session.user.id, ticketId, body);
    return apiSuccess({ ticket });
  } catch (error) {
    return apiError(error);
  }
}
