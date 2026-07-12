"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await signIn("credentials", {
        email: String(form.get("email") || "").trim().toLowerCase(),
        password: String(form.get("password") || ""),
        redirect: false,
        callbackUrl,
      });

      if (typeof response === "string") {
        router.push(response);
        router.refresh();
        return;
      }

      if (response?.error) {
        setError("Invalid credentials");
        return;
      }

      router.push(response?.url || callbackUrl);
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_520px_at_105%_-10%,rgba(249,115,22,0.08),transparent_58%),radial-gradient(760px_460px_at_-8%_12%,rgba(34,211,238,0.07),transparent_64%),linear-gradient(150deg,rgba(9,15,21,0.32)_0%,rgba(6,8,14,0.26)_45%,rgba(18,13,8,0.3)_100%)]"
      />

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-3xl border border-orange-300/30 bg-slate-950/55 p-7 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.85)] backdrop-blur-sm"
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-orange-100/85">StarCitizenOps</p>
          <h1 className="text-3xl font-semibold text-orange-50">Mission Control Login</h1>
          <p className="text-sm text-slate-300">Rejoin your command deck and continue active operations.</p>
        </div>

        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45"
            name="email"
            type="email"
            required
            placeholder="Email"
          />
          <input
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45"
            name="password"
            type="password"
            required
            placeholder="Password"
          />
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            disabled={loading}
            className="w-full rounded-xl border border-orange-200/40 bg-orange-400/85 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            {loading ? "Authenticating..." : "Log In"}
          </button>
          <Link
            href="/register"
            className="w-full rounded-xl border border-cyan-300/45 bg-cyan-300/10 px-3 py-2.5 text-center font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            Join
          </Link>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-300">
          <Link href="/forgot-password" className="text-cyan-300 hover:text-cyan-100">
            Forgot password?
          </Link>
          <span>
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">
              Register
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_520px_at_105%_-10%,rgba(249,115,22,0.08),transparent_58%),radial-gradient(760px_460px_at_-8%_12%,rgba(34,211,238,0.07),transparent_64%),linear-gradient(150deg,rgba(9,15,21,0.32)_0%,rgba(6,8,14,0.26)_45%,rgba(18,13,8,0.3)_100%)]"
          />
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-orange-300/30 bg-slate-950/55 p-6 text-orange-100 backdrop-blur-sm">
            Loading login...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
