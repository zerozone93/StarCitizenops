import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { setOperationRSVP } from "@/server/rsvp";

async function getAttendeeSummary(operationId: string) {
  const counts = await prisma.rSVP.groupBy({
    by: ["status"],
    where: { operationId },
    _count: { status: true },
  });

  return {
    attending: counts.find((item) => item.status === "GOING")?._count.status ?? 0,
    maybe: counts.find((item) => item.status === "MAYBE")?._count.status ?? 0,
    declined: counts.find((item) => item.status === "DECLINED")?._count.status ?? 0,
    standby: counts.find((item) => item.status === "STANDBY")?._count.status ?? 0,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operationId } = await params;
    const attendeeSummary = await getAttendeeSummary(operationId);
    const mine = await prisma.rSVP.findUnique({
      where: { operationId_userId: { operationId, userId: session.user.id } },
      select: { status: true },
    });

    return apiSuccess({ attendeeSummary, myStatus: mine?.status || null });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operationId } = await params;
    const body = (await request.json()) as {
      status?: string;
      note?: string;
      preferredRole?: string;
      team?: string;
    };

    await setOperationRSVP(session.user.id, operationId, {
      status: String(body?.status || "MAYBE"),
      note: body?.note,
      preferredRole: body?.preferredRole,
      team: body?.team,
    });

    const [attendeeSummary, mine] = await Promise.all([
      getAttendeeSummary(operationId),
      prisma.rSVP.findUnique({
        where: { operationId_userId: { operationId, userId: session.user.id } },
        select: { status: true },
      }),
    ]);

    return apiSuccess({ ok: true, attendeeSummary, myStatus: mine?.status || null });
  } catch (error) {
    return apiError(error);
  }
}
