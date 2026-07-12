"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-rose-300">Invalid or missing reset token. Please request a new link.</p>
        <Link href="/forgot-password" className="block text-center text-sm text-cyan-300 hover:text-cyan-100">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-orange-100/85">StarCitizenOps</p>
        <h1 className="text-3xl font-semibold text-orange-50">New Password</h1>
        <p className="text-sm text-slate-300">Choose a strong password for your account.</p>
      </div>

      {done ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="font-semibold text-emerald-100">Password updated!</p>
          <p className="mt-1 text-sm text-slate-300">Redirecting to login…</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45 focus:outline-none"
            type="password"
            required
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45 focus:outline-none"
            type="password"
            required
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-xl border border-orange-200/40 bg-orange-400/85 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            {loading ? "Updating…" : "Set New Password"}
          </button>
        </form>
      )}

      <Link href="/login" className="block text-center text-sm text-slate-400 hover:text-slate-200">
        ← Back to login
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 bg-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_520px_at_105%_-10%,rgba(249,115,22,0.08),transparent_58%),radial-gradient(760px_460px_at_-8%_12%,rgba(34,211,238,0.07),transparent_64%),linear-gradient(150deg,rgba(9,15,21,0.32)_0%,rgba(6,8,14,0.26)_45%,rgba(18,13,8,0.3)_100%)]"
      />
      <div className="w-full max-w-md rounded-3xl border border-orange-300/30 bg-slate-950/55 p-7 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.85)] backdrop-blur-sm">
        <Suspense fallback={<p className="text-slate-300">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
