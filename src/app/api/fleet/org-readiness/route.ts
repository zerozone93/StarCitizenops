import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getOrganizationFleetReadiness } from "@/lib/fleet-actions";

const querySchema = z.object({
  organizationId: z.string().min(1),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    organizationId: searchParams.get("organizationId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const readiness = await getOrganizationFleetReadiness(parsed.data.organizationId);
  return NextResponse.json(readiness);
}
