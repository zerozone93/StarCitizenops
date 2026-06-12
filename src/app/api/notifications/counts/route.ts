import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: 0, messages: 0 });
  }

  // Get the user's conversation IDs
  const memberships = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
    select: { conversationId: true },
  });
  const conversationIds = memberships.map((m) => m.conversationId);

  const since = new Date(Date.now() - 60 * 60 * 1000); // last hour

  const [notifications, messages] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    conversationIds.length > 0
      ? prisma.message.count({
          where: {
            conversationId: { in: conversationIds },
            senderId: { not: session.user.id },
            createdAt: { gte: since },
          },
        })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({ notifications, messages });
}
