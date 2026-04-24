import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateOperationPlan } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  prompt: z.string().min(10).max(2000),
  operationId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { prompt, operationId } = schema.parse(body)

    const result = await generateOperationPlan(prompt)

    await prisma.aIGeneratedPlan.create({
      data: {
        userId: session.user.id,
        operationId: operationId ?? null,
        prompt,
        result,
      },
    })

    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : "Failed to generate plan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
