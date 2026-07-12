/**
 * Trigger Discord role sync for a user within an organization.
 * Called internally after org role changes (member promotion/demotion).
 * Also callable by org owners to manually re-sync a member.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMemberRole } from "@/lib/discord";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { organizationId, targetUserId } = await req.json();

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  }

  // Must be the org owner or the user themselves
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true, discordGuildId: true, discordBotToken: true, discordRoleSyncEnabled: true },
  });

  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
  if (!org.discordRoleSyncEnabled) return NextResponse.json({ skipped: "role sync disabled" });

  const subjectId = targetUserId ?? session.user.id;
  const isOwner = org.ownerId === session.user.id;
  const isSelf = subjectId === session.user.id;

  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!org.discordGuildId || !org.discordBotToken) {
    return NextResponse.json({ skipped: "Discord not configured for this org" });
  }

  const [membership, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: subjectId, organizationId } },
      select: { role: true },
    }),
    prisma.user.findUnique({ where: { id: subjectId }, select: { discordUserId: true } }),
  ]);

  if (!membership || !user?.discordUserId) {
    return NextResponse.json({ skipped: "Member not found or Discord not linked" });
  }

  await syncMemberRole(org.discordGuildId, org.discordBotToken, user.discordUserId, membership.role);

  return NextResponse.json({ success: true, role: membership.role });
}
