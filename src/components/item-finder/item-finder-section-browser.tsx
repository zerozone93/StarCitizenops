import Link from "next/link";
import {
  formatItemFinderLabel,
  toneForVerificationStatus,
  type ItemFinderContextSummary,
  type ItemFinderListEntry,
  type ItemFinderOverlay,
  type ItemFinderSection,
} from "@/lib/item-finder";

function verificationToneClass(status: string) {
  const tone = toneForVerificationStatus(status);

  if (tone === "emerald") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "amber") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  return "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";
}

function overlayToneClass(overlay: ItemFinderOverlay) {
  if (overlay.tone === "emerald") {
    return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
  }

  if (overlay.tone === "orange") {
    return "border-orange-300/25 bg-orange-400/10 text-orange-100";
  }

  return "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
}

export function ItemFinderSectionBrowser({
  section,
  sectionLabel,
  sectionDescription,
  entries,
  availableStatuses,
  availableCategories,
  contextSummary,
  query,
  status,
  category,
  sort,
  totalEntries,
  filteredEntries,
}: {
  section: ItemFinderSection;
  sectionLabel: string;
  sectionDescription: string;
  entries: ItemFinderListEntry[];
  availableStatuses: string[];
  availableCategories: string[];
  contextSummary: ItemFinderContextSummary;
  query: string;
  status: string;
  category: string;
  sort: "name" | "status" | "category";
  totalEntries: number;
  filteredEntries: number;
}) {
  const basePath = `/tools/item-finder/${section}`;

  const createQueryString = (nextValues: Record<string, string>) => {
    const params = new URLSearchParams();

    if (nextValues.query) params.set("q", nextValues.query);
    if (nextValues.status && nextValues.status !== "all") params.set("status", nextValues.status);
    if (nextValues.category && nextValues.category !== "all") params.set("category", nextValues.category);
    if (nextValues.sort && nextValues.sort !== "name") params.set("sort", nextValues.sort);

    return params.toString();
  };

  const currentQuery = createQueryString({ query, status, category, sort });

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-orange-300/20 bg-[linear-gradient(145deg,rgba(249,115,22,0.12),rgba(8,15,23,0.92)_38%,rgba(6,182,212,0.08))] p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-100/80">Section Index</p>
            <h3 className="text-3xl font-semibold text-orange-50">{sectionLabel}</h3>
            <p className="text-sm leading-6 text-slate-300">{sectionDescription}</p>
          </div>
          <div className="max-w-md rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">Operator Overlay Context</p>
            <p className="mt-2 text-sm text-slate-300">
              {contextSummary.organizations.length
                ? `${contextSummary.organizations.map((entry) => `${entry.name} [${entry.tag}]`).join(", ")}`
                : "No organization memberships detected."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {contextSummary.capabilities.map((capability) => (
                <span key={capability} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
                  {capability}
                </span>
              ))}
              {contextSummary.hasMiningOps ? (
                <span className="rounded-full border border-orange-300/25 bg-orange-400/10 px-2.5 py-1 text-xs text-orange-100">Mining Ops Active</span>
              ) : null}
              {contextSummary.hasCraftingGoals ? (
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">Crafting Goals Active</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <form action={basePath} method="get" className="rounded-3xl border border-cyan-300/20 bg-slate-950/55 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">Search</span>
            <input
              name="q"
              defaultValue={query}
              placeholder={`Search ${sectionLabel.toLowerCase()} records`}
              className="w-full rounded-2xl border border-cyan-300/20 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">Status</span>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-2xl border border-cyan-300/20 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40"
            >
              <option value="all">All statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatItemFinderLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">Category</span>
            <select
              name="category"
              defaultValue={category}
              className="w-full rounded-2xl border border-cyan-300/20 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40"
            >
              <option value="all">All categories</option>
              {availableCategories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">Sort</span>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-2xl border border-cyan-300/20 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40"
            >
              <option value="name">Name</option>
              <option value="status">Verification</option>
              <option value="category">Category</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/20">
            Apply filters
          </button>
          <Link href={basePath} className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/25">
            Reset
          </Link>
          <p className="text-xs text-slate-500">
            Showing {filteredEntries} of {totalEntries} records.
          </p>
        </div>
      </form>

      <section className="space-y-4 rounded-3xl border border-cyan-300/20 bg-slate-950/55 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Catalog Sweep</p>
          <h4 className="mt-1 text-xl font-semibold text-cyan-100">{filteredEntries} matching records</h4>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`${basePath}/${encodeURIComponent(entry.id)}${currentQuery ? `?${currentQuery}` : ""}`}
              className="rounded-3xl border border-slate-800 bg-slate-950/85 p-4 transition hover:border-cyan-300/25 hover:bg-slate-900/90"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{entry.category}</span>
                <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${verificationToneClass(entry.verificationStatus)}`}>
                  {formatItemFinderLabel(entry.verificationStatus)}
                </span>
              </div>
              <h5 className="mt-3 text-lg font-semibold text-slate-100">{entry.name}</h5>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{entry.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.overlays.map((overlay) => (
                  <span key={`${entry.id}-${overlay.kind}`} className={`rounded-full border px-2.5 py-1 text-xs ${overlayToneClass(overlay)}`}>
                    {overlay.label}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">Open dossier</p>
            </Link>
          ))}
        </div>

        {!entries.length ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-sm text-slate-400">
            No records matched the current filters.
          </div>
        ) : null}
      </section>
    </section>
  );
}