import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ItemFinderSectionBrowser } from "@/components/item-finder/item-finder-section-browser";
import { ITEM_FINDER_SECTIONS, type ItemFinderSection } from "@/lib/item-finder";
import { requireUser } from "@/lib/session";
import { getItemFinderSectionPayload } from "@/server/item-finder";

type ItemFinderSectionPageProps = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ q?: string; status?: string; category?: string; sort?: string }>;
};

function isValidSection(section: string): section is ItemFinderSection {
  return ITEM_FINDER_SECTIONS.some((entry) => entry.id === section);
}

export default async function ItemFinderSectionPage({ params, searchParams }: ItemFinderSectionPageProps) {
  const user = await requireUser();
  const { section } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidSection(section)) {
    notFound();
  }

  const payload = await getItemFinderSectionPayload(user.id, section, {
    query: resolvedSearchParams.q,
    status: resolvedSearchParams.status,
    category: resolvedSearchParams.category,
    sort: resolvedSearchParams.sort === "status" || resolvedSearchParams.sort === "category" ? resolvedSearchParams.sort : "name",
  });

  return (
    <AppShell title="Item Finder" subtitle={`${payload.sectionMeta.label} section`}>
      <ItemFinderSectionBrowser
        section={payload.section}
        sectionLabel={payload.sectionMeta.label}
        sectionDescription={payload.sectionMeta.description}
        entries={payload.entries}
        availableStatuses={payload.availableStatuses}
        availableCategories={payload.availableCategories}
        contextSummary={payload.contextSummary}
        query={payload.filters.query}
        status={payload.filters.status}
        category={payload.filters.category}
        sort={payload.filters.sort}
        totalEntries={payload.totalEntries}
        filteredEntries={payload.filteredEntries}
      />
    </AppShell>
  );
}