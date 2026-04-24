import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({ status: z.enum(["ATTENDING", "MAYBE", "DECLINED"]) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  try {
    const body = await req.json()
    const { status } = schema.parse(body)

    const rsvp = await prisma.rSVP.upsert({
      where: { operationId_userId: { operationId: id, userId: session.user.id } },
      create: { operationId: id, userId: session.user.id, status },
      update: { status },
    })

    return NextResponse.json(rsvp)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
