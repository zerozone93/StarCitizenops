import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ChecklistItem = {
  id: "guild_access" | "channel_access" | "read_history" | "post_embed" | "role_api";
  label: string;
  ok: boolean;
  detail: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const organizationId = String(body.organizationId || "");
  const discordGuildId = String(body.discordGuildId || "");
  const discordBotToken = String(body.discordBotToken || "");
  const discordOperationsChannelId = String(body.discordOperationsChannelId || "");

  if (!organizationId || !discordGuildId || !discordBotToken || !discordOperationsChannelId) {
    return NextResponse.json(
      { error: "organizationId, discordGuildId, discordBotToken, discordOperationsChannelId are required" },
      { status: 400 },
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!org || org.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authHeader = { Authorization: `Bot ${discordBotToken}` };
  const checklist: ChecklistItem[] = [];

  const guildRes = await fetch(`https://discord.com/api/v10/guilds/${discordGuildId}`, {
    headers: authHeader,
  });

  checklist.push({
    id: "guild_access",
    label: "Guild Access",
    ok: guildRes.ok,
    detail: guildRes.ok
      ? "Bot can access this Discord server."
      : `Discord ${guildRes.status} when reading guild ${discordGuildId}.`,
  });

  if (!guildRes.ok) {
    const details = await guildRes.text();
    return NextResponse.json(
      {
        error: "Failed guild validation",
        details: `Could not access guild ${discordGuildId}. Ensure bot is invited and token is valid. Discord ${guildRes.status}: ${details}`,
        checklist,
      },
      { status: 400 },
    );
  }

  const channelRes = await fetch(`https://discord.com/api/v10/channels/${discordOperationsChannelId}`, {
    headers: authHeader,
  });

  checklist.push({
    id: "channel_access",
    label: "Channel Access",
    ok: channelRes.ok,
    detail: channelRes.ok
      ? "Bot can access the configured operations channel."
      : `Discord ${channelRes.status} when reading channel ${discordOperationsChannelId}.`,
  });

  if (!channelRes.ok) {
    const details = await channelRes.text();
    return NextResponse.json(
      {
        error: "Failed channel validation",
        details: `Could not access channel ${discordOperationsChannelId}. Ensure the bot can view/post in that channel. Discord ${channelRes.status}: ${details}`,
        checklist,
      },
      { status: 400 },
    );
  }

  const historyRes = await fetch(
    `https://discord.com/api/v10/channels/${discordOperationsChannelId}/messages?limit=1`,
    {
      headers: authHeader,
    },
  );

  checklist.push({
    id: "read_history",
    label: "Read Message History",
    ok: historyRes.ok,
    detail: historyRes.ok
      ? "Bot can read channel message history."
      : `Discord ${historyRes.status} while reading channel history.`,
  });

  const roleApiRes = await fetch(`https://discord.com/api/v10/guilds/${discordGuildId}/roles`, {
    headers: authHeader,
  });

  checklist.push({
    id: "role_api",
    label: "Role API Access",
    ok: roleApiRes.ok,
    detail: roleApiRes.ok
      ? "Bot can read guild roles (needed for role-sync workflows)."
      : `Discord ${roleApiRes.status} while accessing guild roles.`,
  });

  const messageRes = await fetch(
    `https://discord.com/api/v10/channels/${discordOperationsChannelId}/messages`,
    {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: "Discord Integration Test",
            description:
              "Connection test from StarCitizenOps succeeded. This channel is ready for operation alerts and RSVP buttons.",
            color: 0x57f287,
            fields: [
              { name: "Organization", value: org.name, inline: true },
              { name: "Timestamp", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
            ],
            footer: { text: "StarCitizenOps · Test Message" },
          },
        ],
      }),
    },
  );

  if (!messageRes.ok) {
    const details = await messageRes.text();
    checklist.push({
      id: "post_embed",
      label: "Post Messages + Embeds",
      ok: false,
      detail: `Discord ${messageRes.status} while posting embed test message.`,
    });
    return NextResponse.json(
      {
        error: "Failed to post test message",
        details: `Validation passed, but posting failed. Check bot channel permissions (Send Messages, Embed Links). Discord ${messageRes.status}: ${details}`,
        checklist,
      },
      { status: 400 },
    );
  }

  checklist.push({
    id: "post_embed",
    label: "Post Messages + Embeds",
    ok: true,
    detail: "Bot successfully posted an embed test message to the channel.",
  });

  return NextResponse.json({
    success: true,
    message: "Discord connection verified and test message posted successfully.",
    checklist,
  });
}
