import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getItemFinderOverview } from "@/server/item-finder";
import { requireUser } from "@/lib/session";

export default async function ItemFinderPage() {
  const user = await requireUser();
  const overview = await getItemFinderOverview(user.id);

  return (
    <AppShell title="Item Finder" subtitle="Mining, crafting, armor, weapons, and utility index">
      <section className="space-y-5">
        <div className="rounded-3xl border border-orange-300/20 bg-[linear-gradient(145deg,rgba(249,115,22,0.12),rgba(8,15,23,0.92)_38%,rgba(6,182,212,0.08))] p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-orange-100/80">Command Index</p>
              <h3 className="text-3xl font-semibold text-orange-50">StarOps Item Finder</h3>
              <p className="text-sm leading-6 text-slate-300">
                Deep-linkable dossiers are now available for each mining resource, blueprint, recipe, armor record, weapon entry, and utility item.
                Section payloads are normalized server-side and routed into smaller slices before they reach the client.
              </p>
            </div>
            <div className="grid gap-3">
              {overview.stats.map((stat) => (
                <article key={stat.id} className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-cyan-100">{stat.value}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-300/20 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Overlay Context</p>
          <p className="mt-2 text-sm text-slate-300">
            {overview.contextSummary.organizations.length
              ? overview.contextSummary.organizations.map((entry) => `${entry.name} [${entry.tag}]`).join(", ")
              : "No organization memberships detected."}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {overview.contextSummary.capabilities.map((capability) => (
              <span key={capability} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
                {capability}
              </span>
            ))}
            {overview.contextSummary.hasMiningOps ? (
              <span className="rounded-full border border-orange-300/25 bg-orange-400/10 px-2.5 py-1 text-xs text-orange-100">Mining Ops Active</span>
            ) : null}
            {overview.contextSummary.hasCraftingGoals ? (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">Crafting Goals Active</span>
            ) : null}
          </div>
        </div>

        <section className="grid gap-4">
          {overview.sections.map((section) => {
            const stat = overview.stats.find((entry) => entry.id === section.id);

            return (
              <Link
                key={section.id}
                href={`/tools/item-finder/${section.id}`}
                className="rounded-3xl border border-slate-800 bg-slate-950/85 p-5 transition hover:border-cyan-300/25 hover:bg-slate-900/90"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Section</p>
                <h4 className="mt-2 text-2xl font-semibold text-slate-100">{section.label}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <span className="text-sm text-cyan-200">{stat?.value ?? 0} indexed records</span>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-orange-100">Open</span>
                </div>
              </Link>
            );
          })}
        </section>
      </section>
    </AppShell>
  );
}