import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const supportKey = process.env.SUPPORT_RESET_KEY;
  const providedKey = request.headers.get("x-support-reset-key");

  if (!supportKey || !providedKey || providedKey !== supportKey) {
    return unauthorized();
  }

  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const tempPassword = randomBytes(9).toString("base64url");
  const passwordHash = await hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      twoFactorEmailCode: null,
      twoFactorEmailCodeExpiry: null,
    },
  });

  return NextResponse.json({
    success: true,
    email: user.email,
    tempPassword,
  });
}
