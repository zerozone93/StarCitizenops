import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

type TopNavProps = {
  title?: string;
  subtitle?: string;
};

export async function TopNav({ title, subtitle }: TopNavProps) {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-orange-300/20 bg-gradient-to-r from-slate-900/90 via-slate-900/85 to-orange-950/35 px-4 py-3 lg:px-6">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-orange-100/80 sm:text-xs">{subtitle || "Operations planning platform"}</p>
          <h2 className="mt-1 text-xl font-semibold text-orange-50 sm:text-2xl">{title || "Mission Control"}</h2>
        </div>
        <div className="flex flex-col items-stretch gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
          <Link className="hidden rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-cyan-100 hover:bg-cyan-300/20 sm:inline-flex" href="/dashboard">
            Dashboard
          </Link>
          {session?.user ? (
            <>
              <Link className="rounded-lg border border-orange-300/35 bg-orange-400/10 px-3 py-1.5 text-center text-orange-100 hover:bg-orange-300/20" href="/operations/new">
                New Op
              </Link>
              <Link className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-center text-cyan-100 hover:bg-cyan-300/20" href="/ai-planner">
                AI
              </Link>
              <Link className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-center text-cyan-100 hover:bg-cyan-300/20" href="/calendar">
                Calendar
              </Link>
              <Link
                className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-center text-cyan-100 transition-colors hover:bg-cyan-300/20"
                href="/chat"
                title="Messages & Chat"
              >
                Chat
              </Link>
              <Link
                className="rounded-lg border border-amber-300/35 bg-amber-400/10 px-3 py-1.5 text-center text-amber-100 transition-colors hover:bg-amber-300/20"
                href="/notifications"
                title="Notifications"
              >
                Alerts
              </Link>
              <span className="max-w-full truncate text-slate-200 sm:max-w-40">
                {session.user.name || session.user.email}
              </span>
              <SignOutButton className="rounded-lg border border-orange-300/40 bg-orange-400/10 px-3 py-1.5 text-orange-100 hover:bg-orange-300/20" />
            </>
          ) : (
            <Link className="rounded-lg border border-orange-300/40 bg-orange-400/10 px-3 py-1.5 text-center text-orange-100 hover:bg-orange-300/20" href="/login">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
