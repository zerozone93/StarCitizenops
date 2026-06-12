"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-flags";

export function TwoFactorSetup() {
  const sessionState = useSession();
  const session = sessionState?.data;
  const [method, setMethod] = useState<"TOTP" | "EMAIL">("TOTP");
  const [step, setStep] = useState<"choose" | "setup" | "confirm" | "done">("choose");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [disabling, setDisabling] = useState(false);

  async function startSetup() {
    setError(null);
    setLoading(true);
    try {
      if (method === "TOTP") {
        const res = await fetch("/api/2fa/setup");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep("setup");
      } else {
        const res = await fetch("/api/2fa/email-code", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStep("confirm");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA() {
    setDisabling(true);
    setError(null);
    try {
      const res = await fetch("/api/2fa/disable", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA.");
    } finally {
      setDisabling(false);
    }
  }

  if (!TWO_FACTOR_ENABLED) {
    return (
      <div className="max-w-md space-y-4 rounded-3xl border border-orange-300/30 bg-slate-950/55 p-7 text-center backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-orange-50">2FA Disabled</h1>
        <p className="text-slate-300">Two-factor authentication will be enabled at launch.</p>
        <Link href="/settings" className="text-cyan-300 hover:text-cyan-100">
          Back to Settings
        </Link>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="max-w-md space-y-5 rounded-3xl border border-emerald-300/30 bg-slate-950/55 p-7 text-center backdrop-blur-sm">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-semibold text-emerald-100">Two-Factor Authentication Enabled</h1>
        <p className="text-slate-300">
          {method === "TOTP"
            ? "Your authenticator app is now linked. You'll need it every time you log in."
            : "Email verification is now enabled. We'll send a code to your email each login."}
        </p>
        <Link
          href="/settings"
          className="inline-block rounded-xl border border-orange-300/40 bg-orange-400/85 px-4 py-2.5 font-semibold text-slate-950 hover:bg-orange-300"
        >
          Back to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-6 rounded-3xl border border-orange-300/30 bg-slate-950/55 p-7 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.85)] backdrop-blur-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-orange-100/85">Security Settings</p>
        <h1 className="mt-1 text-3xl font-semibold text-orange-50">Two-Factor Authentication</h1>
        <p className="mt-1 text-sm text-slate-400">Add an extra layer of security to your account.</p>
      </div>

      {session?.user && (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="font-semibold text-emerald-200">✓ 2FA is currently enabled</p>
            <p className="mt-1 text-sm text-slate-300">
              Method:{" "}
              <span className="font-medium text-slate-100">
                {(session.user as { twoFactorMethod?: string }).twoFactorMethod === "TOTP"
                  ? "Authenticator App (TOTP)"
                  : "Email OTP"}
              </span>
            </p>
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            onClick={disable2FA}
            disabled={disabling}
            className="w-full rounded-xl border border-rose-300/40 bg-rose-500/20 px-3 py-2.5 font-semibold text-rose-100 transition hover:bg-rose-500/30 disabled:opacity-50"
          >
            {disabling ? "Disabling…" : "Disable 2FA"}
          </button>
        </div>
      ) : (
        <>
          {step === "choose" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">Choose your preferred second factor:</p>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${method === "TOTP" ? "border-orange-400/50 bg-orange-400/10" : "border-slate-600/50 bg-slate-900/40 hover:border-slate-500"}`}
              >
                <input
                  type="radio"
                  name="method"
                  value="TOTP"
                  checked={method === "TOTP"}
                  onChange={() => setMethod("TOTP")}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-semibold text-slate-100">Authenticator App</p>
                  <p className="text-xs text-slate-400">
                    Microsoft Authenticator, Google Authenticator, Authy, etc. Most secure option.
                  </p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${method === "EMAIL" ? "border-cyan-400/50 bg-cyan-400/10" : "border-slate-600/50 bg-slate-900/40 hover:border-slate-500"}`}
              >
                <input
                  type="radio"
                  name="method"
                  value="EMAIL"
                  checked={method === "EMAIL"}
                  onChange={() => setMethod("EMAIL")}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-semibold text-slate-100">Email Verification</p>
                    <p className="text-xs text-slate-400">
                      We&apos;ll send a one-time code to {session?.user?.email} each time you log in.
                    </p>
                </div>
              </label>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <button
                onClick={startSetup}
                disabled={loading}
                className="w-full rounded-xl border border-orange-200/40 bg-orange-400/85 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-orange-300 disabled:opacity-60"
              >
                {loading ? "Setting up…" : "Continue"}
              </button>
            </div>
          )}

          {step === "setup" && qrCode && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Scan this QR code in{" "}
                <strong className="text-slate-100">Microsoft Authenticator</strong> or any TOTP app,
                then enter the 6-digit code below.
              </p>
              <div className="flex justify-center rounded-xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="2FA QR Code" width={200} height={200} />
              </div>
              {secret && (
                <div className="rounded-xl border border-slate-600/50 bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Manual entry key:</p>
                  <p className="mt-1 break-all font-mono text-sm text-slate-200">{secret}</p>
                </div>
              )}
              <button
                onClick={() => setStep("confirm")}
                className="w-full rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-2.5 font-semibold text-cyan-100 hover:bg-cyan-300/20"
              >
                  I&apos;ve scanned it – enter code
              </button>
            </div>
          )}

          {step === "confirm" && (
            <form onSubmit={confirmCode} className="space-y-4">
              <p className="text-sm text-slate-300">
                {method === "EMAIL"
                  ? "Enter the 6-digit code sent to your email."
                  : "Enter the 6-digit code from your authenticator app to confirm."}
              </p>
              <input
                className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-center text-2xl font-mono tracking-[0.5em] text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/45"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <button
                disabled={loading || code.length < 6}
                className="w-full rounded-xl border border-orange-200/40 bg-orange-400/85 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-orange-300 disabled:opacity-60"
                type="submit"
              >
                {loading ? "Confirming…" : "Enable 2FA"}
              </button>
            </form>
          )}
        </>
      )}

      <Link href="/settings" className="block text-center text-sm text-slate-400 hover:text-slate-200">
        ← Back to Settings
      </Link>
    </div>
  );
}
