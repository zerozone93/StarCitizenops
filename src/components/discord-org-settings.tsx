"use client";

import { useState } from "react";

interface DiscordOrgSettingsProps {
  organizationId: string;
  initial: {
    discordGuildId: string | null;
    discordBotToken: string | null;
    discordOperationsChannelId: string | null;
    discordRoleSyncEnabled: boolean;
  };
}

type PermissionCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export function DiscordOrgSettings({ organizationId, initial }: DiscordOrgSettingsProps) {
  const [guildId, setGuildId] = useState(initial.discordGuildId ?? "");
  const [botToken, setBotToken] = useState(initial.discordBotToken ?? "");
  const [channelId, setChannelId] = useState(initial.discordOperationsChannelId ?? "");
  const [roleSync, setRoleSync] = useState(initial.discordRoleSyncEnabled);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [checks, setChecks] = useState<PermissionCheck[]>([]);

  async function save() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/discord/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          discordGuildId: guildId || null,
          discordBotToken: botToken || null,
          discordOperationsChannelId: channelId || null,
          discordRoleSyncEnabled: roleSync,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    setChecks([]);
    try {
      const res = await fetch("/api/discord/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          discordGuildId: guildId,
          discordBotToken: botToken,
          discordOperationsChannelId: channelId,
        }),
      });

      const data = await res.json();
      const receivedChecks = Array.isArray(data?.checklist) ? (data.checklist as PermissionCheck[]) : [];
      setChecks(receivedChecks);
      if (!res.ok) {
        setTestResult({ kind: "error", message: data?.details || data?.error || "Discord test failed." });
        return;
      }

      setTestResult({
        kind: "ok",
        message: data?.message || "Discord connection verified and test message posted.",
      });
    } catch {
      setTestResult({ kind: "error", message: "Could not reach test endpoint." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-3">
        {/* Discord logo mark */}
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-indigo-400" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
        <h3 className="text-lg font-semibold text-indigo-100">Discord Integration</h3>
      </div>

      <p className="text-sm text-slate-400">
        Connect this organization to your Discord server to automatically post operation alerts,
        enable RSVP buttons, slash commands, and member role sync.
      </p>

      {/* Setup guide */}
      <details className="rounded-xl border border-slate-700/50 bg-slate-900/40">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-300 hover:text-slate-100">
          Setup guide ▸
        </summary>
        <ol className="space-y-2 px-4 pb-4 pt-2 text-sm text-slate-400 list-decimal list-inside">
          <li>
            Go to{" "}
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 underline"
            >
              Discord Developer Portal
            </a>{" "}
            and create a new application.
          </li>
          <li>
            Under <strong className="text-slate-300">Bot</strong>, create a bot and copy the{" "}
            <strong className="text-slate-300">Token</strong>.
          </li>
          <li>
            Enable <strong className="text-slate-300">Server Members Intent</strong> and{" "}
            <strong className="text-slate-300">Message Content Intent</strong>.
          </li>
          <li>
            Under <strong className="text-slate-300">OAuth2 → URL Generator</strong>, select scopes{" "}
            <code className="text-xs bg-slate-800 px-1 rounded">bot</code> and{" "}
            <code className="text-xs bg-slate-800 px-1 rounded">applications.commands</code>, then
            add bot permissions: <em>Send Messages, Embed Links, Manage Roles, Read Message History</em>.
          </li>
          <li>Invite the bot to your server using the generated URL.</li>
          <li>
            Set the <strong className="text-slate-300">Interactions Endpoint URL</strong> in your
            app&apos;s General Information to{" "}
            <code className="text-xs bg-slate-800 px-1 rounded break-all">
              {typeof window !== "undefined" ? window.location.origin : ""}/api/discord/interactions
            </code>.
          </li>
          <li>
            Copy your <strong className="text-slate-300">Server ID</strong> (right-click server →
            Copy Server ID; needs Developer Mode enabled in Discord settings).
          </li>
          <li>
            Copy the <strong className="text-slate-300">Channel ID</strong> of the channel where
            operation alerts should be posted.
          </li>
        </ol>
      </details>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Discord Server ID (Guild ID)</label>
          <input
            type="text"
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            placeholder="1234567890123456789"
            className="w-full rounded-xl border border-slate-600/50 bg-slate-900/75 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Bot Token</label>
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="MTxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full rounded-xl border border-slate-600/50 bg-slate-900/75 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none text-sm font-mono"
          />
          <p className="mt-1 text-xs text-slate-500">Stored encrypted. Never shared with other users.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Operations Channel ID</label>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="1234567890123456789"
            className="w-full rounded-xl border border-slate-600/50 bg-slate-900/75 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none text-sm font-mono"
          />
          <p className="mt-1 text-xs text-slate-500">Operation alerts and RSVP buttons will be posted here.</p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={roleSync}
            onChange={(e) => setRoleSync(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-300">Enable role sync</p>
            <p className="text-xs text-slate-500">
              Automatically assign Discord roles matching org roles (e.g. &quot;SCOps: OFFICER&quot;) when members link their Discord accounts.
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Discord Settings"}
        </button>
        <button
          onClick={testConnection}
          disabled={testing || !guildId || !botToken || !channelId}
          className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-50"
        >
          {testing ? "Testing…" : "Test Connection"}
        </button>
        {status === "saved" && <span className="text-sm text-emerald-400">✓ Saved</span>}
        {status === "error" && <span className="text-sm text-rose-400">Failed to save — check your token</span>}
      </div>

      {testResult ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            testResult.kind === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {testResult.message}
        </p>
      ) : null}

      {checks.length ? (
        <div className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Permission Checklist</p>
          <ul className="space-y-2">
            {checks.map((check) => (
              <li key={check.id} className="rounded-md border border-slate-700/50 bg-slate-950/50 p-2">
                <p className={`text-sm font-medium ${check.ok ? "text-emerald-300" : "text-rose-300"}`}>
                  {check.ok ? "✓" : "✕"} {check.label}
                </p>
                <p className="text-xs text-slate-400">{check.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
