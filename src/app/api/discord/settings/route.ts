/**
 * Save/update Discord settings for an organization.
 * Only the org owner can update these settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSlashCommands } from "@/lib/discord";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { organizationId, discordGuildId, discordBotToken, discordOperationsChannelId, discordRoleSyncEnabled } = body;

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org || org.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      discordGuildId: discordGuildId || null,
      discordBotToken: discordBotToken || null,
      discordOperationsChannelId: discordOperationsChannelId || null,
      discordRoleSyncEnabled: Boolean(discordRoleSyncEnabled),
    },
  });

  // If a bot token + guild ID are provided, auto-register slash commands
  if (discordBotToken && discordGuildId) {
    const applicationId = process.env.DISCORD_APPLICATION_ID;
    if (applicationId) {
      try {
        await registerSlashCommands(applicationId, discordBotToken, discordGuildId);
      } catch {
        // Non-fatal — log but don't fail the save
      }
    }
  }

  return NextResponse.json({ success: true });
}
