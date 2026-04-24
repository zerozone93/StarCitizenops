import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { OrgFocusType, OrgVisibility, OrgRole } from "@prisma/client"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  tag: z.string().min(1).max(10),
  description: z.string().optional(),
  focusType: z.nativeEnum(OrgFocusType).default(OrgFocusType.MIXED),
  visibility: z.nativeEnum(OrgVisibility).default(OrgVisibility.PUBLIC),
})

export async function GET() {
  const orgs = await prisma.organization.findMany({
    where: { visibility: "PUBLIC" },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(orgs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const existing = await prisma.organization.findUnique({ where: { tag: data.tag.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ error: "Organization tag already taken" }, { status: 400 })
    }

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        tag: data.tag.toUpperCase(),
        description: data.description,
        focusType: data.focusType,
        visibility: data.visibility,
        owner: { connect: { id: session.user.id } },
        members: {
          create: {
            userId: session.user.id,
            role: OrgRole.OWNER,
          },
        },
      },
    })

    await prisma.activityFeedItem.create({
      data: {
        type: "ORG_CREATED",
        title: `Organization ${org.name} was founded`,
        userId: session.user.id,
        organizationId: org.id,
      },
    })

    return NextResponse.json(org, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
