import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const primaryHref = session?.user ? "/dashboard" : "/register";
  const primaryLabel = session?.user ? "Go to Dashboard" : "Create Command Profile";
  const secondaryHref = session?.user ? "/operations/new" : "/login";
  const secondaryLabel = session?.user ? "Start an Operation" : "Access Mission Control";

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_620px_at_102%_-12%,rgba(249,115,22,0.24),transparent_58%),radial-gradient(860px_520px_at_-12%_8%,rgba(34,211,238,0.16),transparent_62%),linear-gradient(150deg,#090f15_0%,#06080e_42%,#120d08_100%)]"
      />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
        <div className="rounded-3xl border border-orange-300/25 bg-slate-950/70 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-100/90">StarCitizenOps</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-orange-50 sm:text-5xl lg:text-6xl">
            Plan, brief, and run operations without extra clutter.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            Keep the tactical look, but make the workflow simple: create an org, stage an operation, and share it with the right people.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="rounded-xl border border-orange-200/40 bg-orange-400/85 px-5 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-orange-300"
              href={primaryHref}
            >
              {primaryLabel}
            </Link>
            <Link
              className="rounded-xl border border-cyan-300/50 bg-cyan-300/10 px-5 py-2.5 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
              href={secondaryHref}
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {[
            { title: "1. Get set up", body: "Register, choose your timezone, and either join an organization or create your own." },
            { title: "2. Build the mission", body: "Create an operation manually or use the AI planner to draft three structured options." },
            { title: "3. Brief the crew", body: "Share the plan, track RSVPs, and keep everyone on the same schedule in their own timezone." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-300/20 bg-slate-950/65 p-5 backdrop-blur-sm"
            >
              <h2 className="text-xl font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {[
            {
              title: "Operations",
              body: "A single place to create, review, and execute missions.",
              href: "/operations",
            },
            {
              title: "AI Planner",
              body: "Generate three clean mission options, then send one straight into the create form.",
              href: "/ai-planner",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-slate-300/20 bg-slate-950/65 p-5 backdrop-blur-sm transition hover:border-cyan-300/35 hover:bg-slate-950/80"
            >
              <h2 className="text-lg font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
