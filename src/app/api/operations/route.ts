import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.string().default("CUSTOM"),
  description: z.string().optional(),
  objective: z.string().optional(),
  location: z.string().optional(),
  threatLevel: z.string().default("MEDIUM"),
  startTime: z.string().optional(),
  organizationId: z.string().min(1),
  missionBrief: z.string().optional(),
  rulesOfEngagement: z.string().optional(),
  contingencyPlans: z.string().optional(),
  commsPlan: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id

  const ops = await prisma.operation.findMany({
    where: {
      OR: [
        { visibility: "PUBLIC" },
        ...(userId ? [
          { commanderId: userId },
          { participants: { some: { userId } } },
        ] : []),
      ],
    },
    include: {
      organization: true,
      commander: { select: { name: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json(ops)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: session.user.id, organizationId: data.organizationId } },
    })
    if (!member) {
      return NextResponse.json({ error: "You must be a member of this organization" }, { status: 403 })
    }

    const op = await prisma.operation.create({
      data: {
        title: data.title,
        type: data.type as "CUSTOM",
        description: data.description,
        objective: data.objective,
        location: data.location,
        threatLevel: data.threatLevel as "MEDIUM",
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        organizationId: data.organizationId,
        commanderId: session.user.id,
        missionBrief: data.missionBrief,
        rulesOfEngagement: data.rulesOfEngagement,
        contingencyPlans: data.contingencyPlans,
        commsPlan: data.commsPlan,
        participants: {
          create: { userId: session.user.id, assignedRole: "Commander", status: "CONFIRMED" },
        },
      },
    })

    await prisma.activityFeedItem.create({
      data: {
        type: "OPERATION_CREATED",
        title: `Operation ${op.title} was created`,
        userId: session.user.id,
        operationId: op.id,
        organizationId: data.organizationId,
      },
    })

    return NextResponse.json(op, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
