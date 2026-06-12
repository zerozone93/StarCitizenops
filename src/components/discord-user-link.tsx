"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface DiscordUserLinkProps {
  discordUserId: string | null;
  discordUsername: string | null;
}

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "";
const SCOPES = "identify";

function buildDiscordOAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

function DiscordUserLinkInner({ discordUserId, discordUsername }: DiscordUserLinkProps) {
  const searchParams = useSearchParams();
  const discordStatus = searchParams.get("discord");

  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/discord/oauth/callback`
      : "";

  const toastMessage =
    discordStatus === "linked"
      ? { type: "success", text: "Discord account linked successfully." }
      : discordStatus === "cancelled"
        ? { type: "info", text: "Discord linking was cancelled." }
        : discordStatus === "error"
          ? { type: "error", text: `Failed to link Discord account (${searchParams.get("reason") ?? "unknown error"}).` }
          : null;

  return (
    <section className="space-y-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-indigo-400" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
        <h3 className="text-lg font-semibold text-indigo-100">Discord Account</h3>
      </div>

      {toastMessage && (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${
            toastMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : toastMessage.type === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                : "border-slate-500/30 bg-slate-800/50 text-slate-300"
          }`}
        >
          {toastMessage.text}
        </p>
      )}

      {discordUserId ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-slate-200">Linked as <span className="text-indigo-300">{discordUsername ?? discordUserId}</span></p>
            <p className="text-sm text-slate-400">Your Discord account is connected. RSVP buttons in Discord will recognize you.</p>
          </div>
          <form action="/api/discord/unlink" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-200 hover:bg-rose-500/20 transition"
            >
              Unlink
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-slate-200">Not linked</p>
            <p className="text-sm text-slate-400">
              Link your Discord account to RSVP to operations directly from Discord and enable role sync.
            </p>
          </div>
          {DISCORD_CLIENT_ID ? (
            <a
              href={buildDiscordOAuthUrl(redirectUri)}
              className="rounded-lg border border-indigo-400/40 bg-indigo-500/20 px-3 py-1.5 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 transition whitespace-nowrap"
            >
              Link Discord
            </a>
          ) : (
            <span className="text-xs text-slate-500">NEXT_PUBLIC_DISCORD_CLIENT_ID not set</span>
          )}
        </div>
      )}
    </section>
  );
}

export function DiscordUserLink(props: DiscordUserLinkProps) {
  return (
    <Suspense>
      <DiscordUserLinkInner {...props} />
    </Suspense>
  );
}
