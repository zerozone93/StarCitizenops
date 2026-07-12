/**
 * Discord integration utilities.
 * Uses Discord's REST API and webhooks — no persistent gateway connection required.
 * Slash commands are handled via the Interactions Endpoint below.
 */

import { Operation, Organization } from "@prisma/client";
import { createPublicKey, verify } from "crypto";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  embeds?: DiscordEmbed[];
  components?: DiscordComponent[][];
}

export interface DiscordComponent {
  type: number; // 2 = button
  custom_id?: string;
  label?: string;
  style?: number; // 1=Primary,2=Secondary,3=Success,4=Danger,5=Link
  url?: string;
  emoji?: { name: string };
}

// ─── Colours ────────────────────────────────────────────────────────────────

const COLORS = {
  BLUE: 0x5865f2,
  GREEN: 0x57f287,
  RED: 0xed4245,
  YELLOW: 0xfee75c,
  ORANGE: 0xeb6c2d,
  CYAN: 0x1abc9c,
} as const;

// ─── Webhook helpers ────────────────────────────────────────────────────────

/**
 * Post a payload to a Discord webhook URL.
 */
export async function sendWebhookMessage(
  webhookUrl: string,
  payload: DiscordWebhookPayload,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Discord returned ${res.status}: ${text}` };
    }

    // Webhooks return 204 on plain post, 200 with body on ?wait=true
    let messageId: string | undefined;
    if (res.status === 200) {
      const data = await res.json();
      messageId = data.id;
    }
    return { success: true, messageId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Post an operation embed to a Discord webhook URL with RSVP buttons.
 * Returns the Discord message ID so we can tie RSVPs back to it.
 */
export async function postOperationAlert(
  webhookUrl: string,
  operation: Pick<
    Operation,
    "id" | "title" | "description" | "status" | "type" | "threatLevel" | "startTime"
  >,
  org: Pick<Organization, "name" | "tag">,
  baseUrl: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const fields: DiscordEmbed["fields"] = [
    { name: "Status", value: operation.status, inline: true },
    { name: "Type", value: operation.type ?? "General", inline: true },
  ];

  if (operation.threatLevel) {
    fields.push({ name: "Threat Level", value: operation.threatLevel, inline: true });
  }

  if (operation.startTime) {
    const ts = Math.floor(new Date(operation.startTime).getTime() / 1000);
    fields.push({ name: "Start Time", value: `<t:${ts}:F>`, inline: false });
  }

  const payload: DiscordWebhookPayload = {
    username: `StarCitizenOps · ${org.tag}`,
    embeds: [
      {
        title: operation.title,
        description: operation.description ?? undefined,
        url: `${baseUrl}/operations/${operation.id}`,
        color: COLORS.CYAN,
        fields,
        footer: { text: `${org.name} · StarCitizenOps` },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      [
        {
          type: 2,
          custom_id: `rsvp_yes_${operation.id}`,
          label: "RSVP ✅",
          style: 3, // success/green
        },
        {
          type: 2,
          custom_id: `rsvp_no_${operation.id}`,
          label: "Decline ❌",
          style: 4, // danger/red
        },
        {
          type: 2,
          label: "View Operation",
          style: 5, // link
          url: `${baseUrl}/operations/${operation.id}`,
        },
      ],
    ],
  };

  // Use ?wait=true so Discord returns the message object with its ID
  return sendWebhookMessage(`${webhookUrl}?wait=true`, payload);
}

// ─── Discord Bot REST helpers ────────────────────────────────────────────────

interface DiscordRole {
  id: string;
  name: string;
}

/**
 * Fetch all roles in a Discord guild.
 */
export async function getGuildRoles(
  guildId: string,
  botToken: string,
): Promise<DiscordRole[]> {
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Find (or create) a Discord role matching the given name.
 */
export async function findOrCreateRole(
  guildId: string,
  botToken: string,
  roleName: string,
): Promise<string | null> {
  const roles = await getGuildRoles(guildId, botToken);
  const existing = roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
  if (existing) return existing.id;

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: roleName }),
  });
  if (!res.ok) return null;
  const role: DiscordRole = await res.json();
  return role.id;
}

/**
 * Assign a Discord role to a guild member by their Discord user ID.
 */
export async function assignRoleToMember(
  guildId: string,
  botToken: string,
  discordUserId: string,
  roleId: string,
): Promise<boolean> {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bot ${botToken}` },
    },
  );
  return res.ok || res.status === 204;
}

/**
 * Remove a Discord role from a guild member.
 */
export async function removeRoleFromMember(
  guildId: string,
  botToken: string,
  discordUserId: string,
  roleId: string,
): Promise<boolean> {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bot ${botToken}` },
    },
  );
  return res.ok || res.status === 204;
}

/**
 * Sync a user's org role to a corresponding Discord role.
 * Creates the Discord role if it doesn't exist.
 */
export async function syncMemberRole(
  guildId: string,
  botToken: string,
  discordUserId: string,
  orgRoleName: string,
): Promise<void> {
  const roleId = await findOrCreateRole(guildId, botToken, `SCOps: ${orgRoleName}`);
  if (!roleId) return;
  await assignRoleToMember(guildId, botToken, discordUserId, roleId);
}

// ─── Slash command registration ─────────────────────────────────────────────

export const SLASH_COMMANDS = [
  {
    name: "ops",
    description: "View recent operations for this server's linked org",
    options: [
      {
        name: "list",
        description: "List recent operations",
        type: 1, // SUB_COMMAND
      },
    ],
  },
  {
    name: "mission",
    description: "Browse mission templates from the StarCitizenOps library",
    options: [
      {
        name: "list",
        description: "List available mission categories",
        type: 1,
      },
    ],
  },
  {
    name: "fleet",
    description: "Show the organization's fleet summary",
  },
  {
    name: "status",
    description: "Show org readiness and active operation count",
  },
] as const;

/**
 * Register slash commands globally (or for a specific guild during development).
 * Call this once during bot setup — not on every request.
 */
export async function registerSlashCommands(
  applicationId: string,
  botToken: string,
  guildId?: string,
): Promise<void> {
  const url = guildId
    ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${applicationId}/commands`;

  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(SLASH_COMMANDS),
  });
}

// ─── Interaction response helpers ───────────────────────────────────────────

export function interactionResponse(
  content: string,
  ephemeral = false,
): Record<string, unknown> {
  return {
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content,
      flags: ephemeral ? 64 : 0,
    },
  };
}

export function interactionEmbedResponse(
  embed: DiscordEmbed,
  ephemeral = false,
): Record<string, unknown> {
  return {
    type: 4,
    data: {
      embeds: [embed],
      flags: ephemeral ? 64 : 0,
    },
  };
}

// ─── Signature verification ─────────────────────────────────────────────────

/**
 * Verify a Discord interaction request signature using the app's public key.
 * Required by Discord's security model for interaction endpoints.
 */
export async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string,
): Promise<boolean> {
  try {
    // Discord provides a raw 32-byte Ed25519 public key (hex).
    // Node's `verify` expects an SPKI DER key, so prepend the Ed25519 SPKI header.
    const keyBytes = Buffer.from(publicKey, "hex");
    const signatureBytes = Buffer.from(signature, "hex");
    const message = Buffer.from(timestamp + body);

    const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const spkiKey = Buffer.concat([spkiPrefix, keyBytes]);
    const publicKeyObj = createPublicKey({ key: spkiKey, format: "der", type: "spki" });

    return verify(null, message, publicKeyObj, signatureBytes);
  } catch {
    return false;
  }
}

