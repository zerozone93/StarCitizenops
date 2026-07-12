import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { passwordResetToken: token },
    select: { id: true, passwordResetExpiry: true },
  });

  if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  return NextResponse.json({ success: true });
}
