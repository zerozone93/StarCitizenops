import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({ body: z.string().min(1).max(2000) })

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { operationId: params.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { body: commentBody } = schema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        operationId: params.id,
        userId: session.user.id,
        body: commentBody,
      },
      include: { user: { select: { name: true, email: true } } },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
