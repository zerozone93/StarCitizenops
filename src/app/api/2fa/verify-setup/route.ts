import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { verifyTOTPCode } from "@/server/two-factor";
import { prisma } from "@/lib/prisma";

// POST - confirm a TOTP code to activate 2FA
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const code = String(body.code ?? "").trim();
  const method: string = body.method === "EMAIL" ? "EMAIL" : "TOTP";

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true },
  });

  if (method === "TOTP") {
    if (!user?.twoFactorSecret) {
      return NextResponse.json({ error: "No pending TOTP secret. Start setup first." }, { status: 400 });
    }

    const valid = verifyTOTPCode(user.twoFactorSecret, code);
    if (!valid) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
    }
  }

  // Code confirmed – activate 2FA
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorMethod: method,
    },
  });

  return NextResponse.json({ success: true });
}
