"use client";

import { useState, useTransition } from "react";

type AccountClientProps = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    starCitizenHandle: string | null;
    bio: string | null;
    timezone: string | null;
    availability: string | null;
    preferredRoles: string[];
    createdAt: Date;
  };
};

type HandleStatus = "idle" | "checking" | "valid" | "invalid";

function SecurityFormStatus({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (error) {
    return (
      <p className="rounded-md border border-rose-500/30 bg-rose-900/20 p-2 text-xs text-rose-200">
        {error}
      </p>
    );
  }

  if (message) {
    return (
      <p className="rounded-md border border-emerald-500/30 bg-emerald-900/20 p-2 text-xs text-emerald-200">
        {message}
      </p>
    );
  }

  return null;
}

export function AccountClient({ user }: AccountClientProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [handle, setHandle] = useState(user.starCitizenHandle ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [timezone, setTimezone] = useState(user.timezone ?? "");
  const [availability, setAvailability] = useState(user.availability ?? "");
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [handleData, setHandleData] = useState<{ moniker?: string; badge?: string; avatarUrl?: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordState, setPasswordState] = useState<{
    pending: boolean;
    message?: string;
    formError?: string;
    fieldErrors?: Record<string, string>;
  }>({ pending: false });
  const [passwordResetState, setPasswordResetState] = useState<{
    pending: boolean;
    message?: string;
    formError?: string;
    fieldErrors?: Record<string, string>;
  }>({ pending: false });
  const [, startTransition] = useTransition();

  async function checkHandle(value: string) {
    if (!value.trim()) { setHandleStatus("idle"); setHandleData(null); return; }
    setHandleStatus("checking");
    try {
      const res = await fetch(`/api/sc-validate-handle?handle=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (data.valid) {
        setHandleStatus("valid");
        setHandleData(data.profile ?? null);
      } else {
        setHandleStatus("invalid");
        setHandleData(null);
      }
    } catch {
      setHandleStatus("idle");
    }
  }

  async function save() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, starCitizenHandle: handle, bio, timezone, availability }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setEditing(false);
        startTransition(() => {
          setTimeout(() => setSaveStatus("idle"), 2000);
        });
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  async function submitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordState({ pending: true });

    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        currentPassword: String(form.get("currentPassword") || ""),
        newPassword: String(form.get("newPassword") || ""),
        confirmPassword: String(form.get("confirmPassword") || ""),
      };

      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({} as Record<string, unknown>));

      if (!response.ok) {
        setPasswordState({
          pending: false,
          formError: String(data.error || "Unable to update password."),
          fieldErrors:
            typeof data.fieldErrors === "object" && data.fieldErrors !== null
              ? (data.fieldErrors as Record<string, string>)
              : undefined,
        });
        return;
      }

      event.currentTarget.reset();
      setPasswordState({ pending: false, message: String(data.message || "Password updated successfully.") });
    } catch {
      setPasswordState({ pending: false, formError: "Unable to update password." });
    }
  }

  async function submitPasswordReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordResetState({ pending: true });

    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        newPassword: String(form.get("newPassword") || ""),
        confirmPassword: String(form.get("confirmPassword") || ""),
      };

      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({} as Record<string, unknown>));

      if (!response.ok) {
        setPasswordResetState({
          pending: false,
          formError: String(data.error || "Unable to reset password."),
          fieldErrors:
            typeof data.fieldErrors === "object" && data.fieldErrors !== null
              ? (data.fieldErrors as Record<string, string>)
              : undefined,
        });
        return;
      }

      event.currentTarget.reset();
      setPasswordResetState({ pending: false, message: String(data.message || "Password reset successfully.") });
    } catch {
      setPasswordResetState({ pending: false, formError: "Unable to reset password." });
    }
  }

  const handleStatusIcon: Record<HandleStatus, string> = {
    idle: "",
    checking: "⏳",
    valid: "✅",
    invalid: "❌",
  };

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <section className="rounded-2xl border border-orange-300/20 bg-slate-900/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-400/40 bg-slate-800 text-2xl font-bold text-orange-200">
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-orange-50">{user.name || "Unnamed Operator"}</h2>
              <p className="text-sm text-slate-400">{user.email}</p>
              {user.starCitizenHandle && (
                <p className="mt-0.5 text-xs text-cyan-300">@{user.starCitizenHandle}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {!editing && (
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Bio</dt>
              <dd className="mt-0.5 text-slate-300">{user.bio || <span className="italic text-slate-500">Not set</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Time zone</dt>
              <dd className="mt-0.5 text-slate-300">{user.timezone || <span className="italic text-slate-500">Not set</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Availability</dt>
              <dd className="mt-0.5 text-slate-300">{user.availability || <span className="italic text-slate-500">Not set</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Preferred roles</dt>
              <dd className="mt-0.5 text-slate-300">
                {user.preferredRoles.length > 0 ? user.preferredRoles.join(", ") : <span className="italic text-slate-500">Not set</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Member since</dt>
              <dd className="mt-0.5 text-slate-300">
                {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </dd>
            </div>
          </dl>
        )}

        {editing && (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => { e.preventDefault(); save(); }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Display name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-cyan-300/25 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                  placeholder="Display name"
                  required
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
                  Star Citizen handle
                  {handleStatus !== "idle" && <span>{handleStatusIcon[handleStatus]}</span>}
                </label>
                <input
                  value={handle}
                  onChange={(e) => { setHandle(e.target.value); setHandleStatus("idle"); setHandleData(null); }}
                  onBlur={(e) => checkHandle(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none bg-slate-950 ${handleStatus === "valid" ? "border-green-400/50" : handleStatus === "invalid" ? "border-rose-400/50" : "border-cyan-300/25 focus:border-cyan-400/50"}`}
                  placeholder="Enter your RSI handle"
                />
                {handleStatus === "valid" && handleData?.moniker && (
                  <p className="mt-1 text-xs text-green-400">Verified: {handleData.moniker}</p>
                )}
                {handleStatus === "invalid" && (
                  <p className="mt-1 text-xs text-rose-400">Handle not found in RSI records</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Time zone</label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-cyan-300/25 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                  placeholder="e.g. UTC-5 / EST"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Availability</label>
                <input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-xl border border-cyan-300/25 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                  placeholder="e.g. Evenings / Weekends"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-cyan-300/25 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                placeholder="Tell your crew about yourself..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className="rounded-xl border border-orange-200/40 bg-orange-400/85 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-300 disabled:opacity-60"
              >
                {saveStatus === "saving" ? "Saving…" : "Save changes"}
              </button>
              {saveStatus === "saved" && <span className="text-sm text-green-400">Saved ✓</span>}
              {saveStatus === "error" && <span className="text-sm text-rose-400">Save failed</span>}
            </div>
          </form>
        )}
      </section>

      {/* Star Citizen profile card */}
      {user.starCitizenHandle && (
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-300">RSI Profile</h3>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-cyan-400/30 bg-slate-800 flex items-center justify-center text-cyan-300 font-bold">
              {user.starCitizenHandle[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-100">{user.starCitizenHandle}</p>
              <a
                href={`https://robertsspaceindustries.com/citizens/${user.starCitizenHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                View on RSI →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Security section */}
      <section className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Security</h3>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Change password</p>
            <form onSubmit={submitPasswordChange} className="grid gap-3 md:grid-cols-3">
              <div>
                <input
                  required
                  type="password"
                  name="currentPassword"
                  minLength={8}
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  placeholder="Current password"
                />
                {passwordState.fieldErrors?.currentPassword ? (
                  <p className="mt-1 text-xs text-rose-300">{passwordState.fieldErrors.currentPassword}</p>
                ) : null}
              </div>

              <div>
                <input
                  required
                  type="password"
                  name="newPassword"
                  minLength={8}
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  placeholder="New password"
                />
                {passwordState.fieldErrors?.newPassword ? (
                  <p className="mt-1 text-xs text-rose-300">{passwordState.fieldErrors.newPassword}</p>
                ) : null}
              </div>

              <div>
                <input
                  required
                  type="password"
                  name="confirmPassword"
                  minLength={8}
                  className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  placeholder="Confirm new password"
                />
                {passwordState.fieldErrors?.confirmPassword ? (
                  <p className="mt-1 text-xs text-rose-300">{passwordState.fieldErrors.confirmPassword}</p>
                ) : null}
              </div>

              <div className="md:col-span-3 space-y-2">
                <SecurityFormStatus message={passwordState.message} error={passwordState.formError} />
                <button
                  type="submit"
                  disabled={passwordState.pending}
                  className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {passwordState.pending ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-slate-700/40 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Password reset (logged in)</p>
            <form onSubmit={submitPasswordReset} className="grid gap-3 md:grid-cols-2">
              <div>
                <input
                  required
                  type="password"
                  name="newPassword"
                  minLength={8}
                  className="w-full rounded-md border border-amber-500/30 bg-slate-950 p-2 text-sm"
                  placeholder="New password"
                />
                {passwordResetState.fieldErrors?.newPassword ? (
                  <p className="mt-1 text-xs text-rose-300">{passwordResetState.fieldErrors.newPassword}</p>
                ) : null}
              </div>

              <div>
                <input
                  required
                  type="password"
                  name="confirmPassword"
                  minLength={8}
                  className="w-full rounded-md border border-amber-500/30 bg-slate-950 p-2 text-sm"
                  placeholder="Confirm new password"
                />
                {passwordResetState.fieldErrors?.confirmPassword ? (
                  <p className="mt-1 text-xs text-rose-300">{passwordResetState.fieldErrors.confirmPassword}</p>
                ) : null}
              </div>

              <div className="md:col-span-2 space-y-2">
                <SecurityFormStatus message={passwordResetState.message} error={passwordResetState.formError} />
                <button
                  type="submit"
                  disabled={passwordResetState.pending}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {passwordResetState.pending ? "Resetting Password..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
