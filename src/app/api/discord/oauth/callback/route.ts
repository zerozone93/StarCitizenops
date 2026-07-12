/**
 * Discord OAuth callback — links a Discord account to the logged-in user.
 *
 * Flow:
 *  1. User clicks "Link Discord" in Settings → redirected to Discord OAuth
 *  2. Discord redirects back here with a `code` query param
 *  3. We exchange the code for the user's Discord ID + username
 *  4. We save discordUserId and discordUsername on their User record
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?discord=cancelled", req.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/discord/oauth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?discord=error&reason=not_configured", req.url));
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/settings?discord=error&reason=token_exchange", req.url));
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;

  // Fetch Discord user info
  const userRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/settings?discord=error&reason=user_fetch", req.url));
  }

  const discordUser = await userRes.json();
  const discordUserId: string = discordUser.id;
  const discordUsername: string = discordUser.global_name ?? discordUser.username;

  // Check that this Discord account isn't already linked to a different user
  const existing = await prisma.user.findUnique({ where: { discordUserId } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.redirect(new URL("/settings?discord=error&reason=already_linked", req.url));
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { discordUserId, discordUsername },
  });

  return NextResponse.redirect(new URL("/settings?discord=linked", req.url));
}
