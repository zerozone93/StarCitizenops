import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  formatItemFinderLabel,
  getRouteSectionForEntity,
  toneForVerificationStatus,
  ITEM_FINDER_SECTIONS,
  type ItemFinderOverlay,
  type ItemFinderRelatedRecord,
  type ItemFinderSection,
} from "@/lib/item-finder";
import { requireUser } from "@/lib/session";
import { getItemFinderRecordPayload } from "@/server/item-finder";

type ItemFinderRecordPageProps = {
  params: Promise<{ section: string; id: string }>;
  searchParams: Promise<{ q?: string; status?: string; category?: string; sort?: string }>;
};

function isValidSection(section: string): section is ItemFinderSection {
  return ITEM_FINDER_SECTIONS.some((entry) => entry.id === section);
}

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

function buildQueryString(searchParams: { q?: string; status?: string; category?: string; sort?: string }) {
  const params = new URLSearchParams();

  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.sort) params.set("sort", searchParams.sort);

  return params.toString();
}

function RelatedRecordCard({ record }: { record: ItemFinderRelatedRecord }) {
  if (record.recordType === "location") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <p className="text-sm font-medium text-slate-100">{record.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {formatItemFinderLabel(record.locationType)} in {formatItemFinderLabel(record.systemId)}
        </p>
      </div>
    );
  }

  if (record.recordType === "store") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <p className="text-sm font-medium text-slate-100">{record.name}</p>
        <p className="mt-1 text-xs text-slate-500">{formatItemFinderLabel(record.category)}</p>
      </div>
    );
  }

  return (
    <Link
      href={`/tools/item-finder/${getRouteSectionForEntity(record)}/${encodeURIComponent(record.id)}`}
      className="block rounded-2xl border border-slate-800 bg-slate-950 p-3 transition hover:border-cyan-300/25"
    >
      <p className="text-sm font-medium text-slate-100">{record.name}</p>
      <p className="mt-1 text-xs text-slate-500">{record.category}</p>
    </Link>
  );
}

export default async function ItemFinderRecordPage({ params, searchParams }: ItemFinderRecordPageProps) {
  const user = await requireUser();
  const { section, id } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidSection(section)) {
    notFound();
  }

  const payload = await getItemFinderRecordPayload(user.id, section, decodeURIComponent(id));

  if (!payload) {
    notFound();
  }

  const backQueryString = buildQueryString(resolvedSearchParams);
  const backHref = `/tools/item-finder/${payload.section}${backQueryString ? `?${backQueryString}` : ""}`;

  return (
    <AppShell title="Item Finder" subtitle={`${payload.sectionMeta.label} dossier`}>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/tools/item-finder" className="transition hover:text-cyan-100">
            Item Finder
          </Link>
          <span>/</span>
          <Link href={`/tools/item-finder/${payload.section}`} className="transition hover:text-cyan-100">
            {payload.sectionMeta.label}
          </Link>
          <span>/</span>
          <span className="text-slate-200">{payload.entry.name}</span>
        </div>

        <div className="rounded-3xl border border-orange-300/20 bg-[linear-gradient(145deg,rgba(249,115,22,0.12),rgba(8,15,23,0.92)_38%,rgba(6,182,212,0.08))] p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-orange-100/80">Operations Dossier</p>
              <h3 className="text-3xl font-semibold text-orange-50">{payload.entry.name}</h3>
              <p className="text-sm leading-6 text-slate-300">{payload.entry.summary}</p>
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${verificationToneClass(payload.entry.verificationStatus)}`}>
              {formatItemFinderLabel(payload.entry.verificationStatus)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-2.5 py-1 text-xs text-orange-100">
              {payload.entry.category}
            </span>
            {payload.entry.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300">
                {tag}
              </span>
            ))}
            {payload.entry.overlays.map((overlay) => (
              <span key={overlay.kind} className={`rounded-full border px-2.5 py-1 text-xs ${overlayToneClass(overlay)}`}>
                {overlay.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Metadata</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {payload.entry.metadata.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {payload.recipe ? (
              <section className="rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Recipe Inputs</p>
                <div className="mt-3 space-y-2">
                  {payload.recipe.ingredients.map((ingredient) => (
                    <div key={`${ingredient.resourceId}-${ingredient.unit}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{formatItemFinderLabel(ingredient.resourceId)}</p>
                        <p className="text-xs text-slate-500">Resource input</p>
                      </div>
                      <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Linked Records</p>
              <div className="mt-3 space-y-2">
                {payload.relatedRecords.length ? (
                  payload.relatedRecords.map((record) => <RelatedRecordCard key={`${record.recordType}-${record.id}`} record={record} />)
                ) : (
                  <p className="text-sm text-slate-500">No linked records mapped for this entry yet.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4 rounded-3xl border border-orange-300/20 bg-slate-950/55 p-4 xl:sticky xl:top-6 xl:self-start">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Overlay Context</p>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <p>
                  {payload.contextSummary.organizations.length
                    ? payload.contextSummary.organizations.map((entry) => `${entry.name} [${entry.tag}]`).join(", ")
                    : "No organization memberships detected."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {payload.contextSummary.capabilities.map((capability) => (
                    <span key={capability} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
                      {capability}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {payload.entry.overlays.map((overlay) => (
                    <div key={overlay.kind} className={`rounded-2xl border p-3 text-xs ${overlayToneClass(overlay)}`}>
                      <p className="font-semibold uppercase tracking-[0.16em]">{overlay.label}</p>
                      <p className="mt-1 normal-case tracking-normal text-sm">{overlay.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href={backHref}
              className="inline-flex rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/20"
            >
              Back to {payload.sectionMeta.label}
            </Link>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}