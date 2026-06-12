/**
 * Discord Interactions Endpoint
 * Handles:
 *  - Slash commands: /ops list, /mission list, /fleet, /status
 *  - Button interactions: RSVP yes/no on operation embeds
 *
 * Discord requires this endpoint to:
 *  1. Respond to PING challenges with PONG
 *  2. Verify Ed25519 signatures on every request
 *
 * Set the Interactions Endpoint URL in your Discord app dashboard to:
 *   https://yoursite.com/api/discord/interactions
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyDiscordSignature,
  interactionResponse,
  interactionEmbedResponse,
  DiscordEmbed,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY ?? "";

export async function POST(req: NextRequest) {
  // ── 1. Verify Discord signature ───────────────────────────────────────────
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";
  const body = await req.text();

  if (!PUBLIC_KEY) {
    return NextResponse.json({ error: "DISCORD_PUBLIC_KEY not configured" }, { status: 500 });
  }

  const valid = await verifyDiscordSignature(PUBLIC_KEY, signature, timestamp, body);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const interaction = JSON.parse(body);

  // ── 2. PING → PONG ───────────────────────────────────────────────────────
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // ── 3. Slash commands (type 2) ────────────────────────────────────────────
  if (interaction.type === 2) {
    return handleSlashCommand(interaction);
  }

  // ── 4. Component interactions / buttons (type 3) ──────────────────────────
  if (interaction.type === 3) {
    return handleButtonInteraction(interaction);
  }

  return NextResponse.json({ error: "Unknown interaction type" }, { status: 400 });
}

// ── Slash command handler ─────────────────────────────────────────────────────

async function handleSlashCommand(interaction: Record<string, unknown>) {
  const commandName = (interaction.data as Record<string, unknown>)?.name as string;
  const guildId = interaction.guild_id as string | undefined;

  // Find the org linked to this Discord server
  const org = guildId
    ? await prisma.organization.findFirst({ where: { discordGuildId: guildId } })
    : null;

  switch (commandName) {
    case "ops": {
      if (!org) {
        return NextResponse.json(
          interactionResponse("❌ This server is not linked to a StarCitizenOps organization.", true),
        );
      }
      const ops = await prisma.operation.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, startTime: true },
      });
      if (!ops.length) {
        return NextResponse.json(interactionResponse("No operations found for this org."));
      }
      const base = process.env.NEXTAUTH_URL ?? "https://yoursite.com";
      const embed: DiscordEmbed = {
        title: `Recent Operations · ${org.name}`,
        color: 0x1abc9c,
        fields: ops.map((op) => ({
          name: op.title,
          value: `[View](${base}/operations/${op.id}) · ${op.status}${op.startTime ? ` · <t:${Math.floor(new Date(op.startTime).getTime() / 1000)}:R>` : ""}`,
          inline: false,
        })),
        footer: { text: "StarCitizenOps" },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(interactionEmbedResponse(embed));
    }

    case "mission": {
      const categories = await prisma.missionCategory.findMany({
        orderBy: { name: "asc" },
        select: { name: true, templates: { select: { name: true }, take: 3 } },
      });
      const base = process.env.NEXTAUTH_URL ?? "https://yoursite.com";
      const embed: DiscordEmbed = {
        title: "Mission Library",
        url: `${base}/missions`,
        color: 0x5865f2,
        fields: categories.map((c) => ({
          name: c.name,
          value: c.templates.map((t) => `• ${t.name}`).join("\n") || "No templates yet",
          inline: false,
        })),
        footer: { text: "StarCitizenOps · Mission Library" },
      };
      return NextResponse.json(interactionEmbedResponse(embed));
    }

    case "fleet": {
      if (!org) {
        return NextResponse.json(
          interactionResponse("❌ This server is not linked to a StarCitizenOps organization.", true),
        );
      }
      const memberIds = await prisma.organizationMember
        .findMany({ where: { organizationId: org.id }, select: { userId: true } })
        .then((m) => m.map((x) => x.userId));
      const [ships, vehicles] = await Promise.all([
        prisma.ship.count({ where: { userId: { in: memberIds } } }),
        prisma.groundVehicle.count({ where: { userId: { in: memberIds } } }),
      ]);
      const embed: DiscordEmbed = {
        title: `Fleet Summary · ${org.name}`,
        color: 0xeb6c2d,
        fields: [
          { name: "Ships", value: String(ships), inline: true },
          { name: "Ground Vehicles", value: String(vehicles), inline: true },
        ],
        footer: { text: "StarCitizenOps" },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(interactionEmbedResponse(embed));
    }

    case "status": {
      if (!org) {
        return NextResponse.json(
          interactionResponse("❌ This server is not linked to a StarCitizenOps organization.", true),
        );
      }
      const [memberCount, activeOps] = await Promise.all([
        prisma.organizationMember.count({ where: { organizationId: org.id } }),
        prisma.operation.count({ where: { organizationId: org.id, status: "ACTIVE" } }),
      ]);
      const embed: DiscordEmbed = {
        title: `Org Status · ${org.name}`,
        color: 0x57f287,
        fields: [
          { name: "Members", value: String(memberCount), inline: true },
          { name: "Active Operations", value: String(activeOps), inline: true },
        ],
        footer: { text: "StarCitizenOps" },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(interactionEmbedResponse(embed));
    }

    default:
      return NextResponse.json(interactionResponse("Unknown command.", true));
  }
}

// ── Button interaction handler ────────────────────────────────────────────────

async function handleButtonInteraction(interaction: Record<string, unknown>) {
  const customId = ((interaction.data as Record<string, unknown>)?.custom_id as string) ?? "";
  const discordUser = (
    (interaction.member as Record<string, unknown>)?.user ?? interaction.user
  ) as Record<string, unknown> | undefined;
  const discordUserId = discordUser?.id as string | undefined;

  // Parse RSVP button: rsvp_yes_<operationId> or rsvp_no_<operationId>
  const rsvpMatch = customId.match(/^rsvp_(yes|no)_(.+)$/);
  if (!rsvpMatch) {
    return NextResponse.json(interactionResponse("Unknown button action.", true));
  }

  const [, answer, operationId] = rsvpMatch;

  if (!discordUserId) {
    return NextResponse.json(interactionResponse("Could not identify your Discord user.", true));
  }

  // Find the StarCitizenOps user linked to this Discord account
  const user = await prisma.user.findUnique({ where: { discordUserId } });
  if (!user) {
    const base = process.env.NEXTAUTH_URL ?? "https://yoursite.com";
    return NextResponse.json(
      interactionResponse(
        `❌ Your Discord account is not linked to StarCitizenOps. Visit ${base}/settings to connect your account.`,
        true,
      ),
    );
  }

  const operation = await prisma.operation.findUnique({ where: { id: operationId } });
  if (!operation) {
    return NextResponse.json(interactionResponse("Operation not found.", true));
  }

  // Upsert RSVP
  const status = answer === "yes" ? "GOING" : "DECLINED";
  await prisma.rSVP.upsert({
    where: { operationId_userId: { operationId, userId: user.id } },
    update: { status },
    create: { userId: user.id, operationId, status },
  });

  const emoji = answer === "yes" ? "✅" : "❌";
  return NextResponse.json(
    interactionResponse(`${emoji} Your RSVP has been recorded for **${operation.title}**.`, true),
  );
}
