"use client";

import { FormEvent, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default function TwoFactorVerifyPage() {
  const sessionState = useSession();
  const session = sessionState?.data;
  const update = sessionState?.update;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const method = session?.user?.twoFactorMethod ?? "TOTP";

  // Auto-send email code on first load if method is EMAIL
  useEffect(() => {
    if (method === "EMAIL" && !emailSent) {
      sendEmail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  if (!TWO_FACTOR_ENABLED) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-orange-300/30 bg-slate-950/55 p-7 text-center text-slate-200 backdrop-blur-sm">
          Two-factor authentication is currently disabled.
        </div>
      </div>
    );
  }

  async function sendEmail() {
    setSendingEmail(true);
    setError(null);
    try {
      const res = await fetch("/api/2fa/email-code", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send code.");
      } else {
        setEmailSent(true);
      }
    } finally {
      setSendingEmail(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }

      // Clear the twoFactorPending flag in the session JWT
      if (update) {
        await update({ twoFactorPending: false });
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 bg-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_520px_at_105%_-10%,rgba(249,115,22,0.08),transparent_58%),radial-gradient(760px_460px_at_-8%_12%,rgba(34,211,238,0.07),transparent_64%)]"
      />

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-3xl border border-orange-300/30 bg-slate-950/55 p-7 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.85)] backdrop-blur-sm"
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-orange-100/85">StarCitizenOps</p>
          <h1 className="text-3xl font-semibold text-orange-50">Two-Factor Verification</h1>
          <p className="text-sm text-slate-300">
            {method === "EMAIL"
              ? "A 6-digit code was sent to your email. Enter it below."
              : "Open your authenticator app and enter the 6-digit code."}
          </p>
        </div>

        {method === "EMAIL" && (
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">
              {emailSent ? "Code sent." : sendingEmail ? "Sending code…" : ""}
            </p>
            <button
              type="button"
              onClick={sendEmail}
              disabled={sendingEmail}
              className="ml-auto rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-50"
            >
              {sendingEmail ? "Sending…" : "Resend code"}
            </button>
          </div>
        )}

        <input
          className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-center text-2xl font-mono tracking-[0.5em] text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/45"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          disabled={loading || code.length < 6}
          className="w-full rounded-xl border border-orange-200/40 bg-orange-400/85 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Verifying…" : "Verify & Enter Command Deck"}
        </button>
      </form>
    </div>
  );
}
