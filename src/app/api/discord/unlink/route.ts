import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { discordUserId: null, discordUsername: null },
  });

  return NextResponse.redirect(new URL("/settings?discord=unlinked", req.url));
}
