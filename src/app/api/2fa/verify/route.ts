import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { verifyTwoFactorCode } from "@/server/two-factor";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const code = String(body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorMethod: true, twoFactorSecret: true },
  });

  if (!user?.twoFactorMethod) {
    return NextResponse.json({ error: "2FA not configured" }, { status: 400 });
  }

  const valid = await verifyTwoFactorCode(
    session.user.id,
    code,
    user.twoFactorMethod,
    user.twoFactorSecret,
  );

  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
