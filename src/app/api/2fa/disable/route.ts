import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorMethod: null,
      twoFactorSecret: null,
      twoFactorEmailCode: null,
      twoFactorEmailCodeExpiry: null,
    },
  });

  return NextResponse.json({ success: true });
}
