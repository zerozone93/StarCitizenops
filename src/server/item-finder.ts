import "server-only";

import path from "node:path";
import { readFile } from "node:fs/promises";
import { cache } from "react";
import { OrganizationFocusType } from "@prisma/client";
import { getUserFleet } from "@/lib/fleet";
import {
  buildItemFinderModel,
  findEntityForSection,
  getEntitiesForSection,
  getRecipeForEntity,
  getRelatedRecords,
  ITEM_FINDER_SECTIONS,
  type ItemFinderContextSummary,
  type ItemFinderListEntry,
  type ItemFinderModel,
  type ItemFinderOverlay,
  type ItemFinderSection,
  type ItemFinderSnapshot,
} from "@/lib/item-finder";
import { prisma } from "@/lib/prisma";

const datasetPath = path.join(process.cwd(), "public", "data", "starops-item-finder.json");

const MINING_KEYWORDS = ["mining", "ore", "gem", "resource", "quantanium", "hadanite", "extract", "deposit"];
const CRAFTING_KEYWORDS = ["craft", "crafting", "recipe", "blueprint", "fabricator", "material", "ingredient"];
const CRAFTING_FOCUS_TYPES: OrganizationFocusType[] = [
  OrganizationFocusType.LOGISTICS,
  OrganizationFocusType.TRADE,
  OrganizationFocusType.MINING,
  OrganizationFocusType.SALVAGE,
  OrganizationFocusType.MIXED,
];

type OverlayContext = {
  summary: ItemFinderContextSummary;
  hasMiningFleet: boolean;
  hasCombatFleet: boolean;
  hasLogisticsFleet: boolean;
  assetKeywords: string[];
  recipeResourceIds: Set<string>;
};

export type ItemFinderSectionFilters = {
  query?: string;
  status?: string;
  category?: string;
  sort?: "name" | "status" | "category";
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeFilterText(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function applySectionFilters(entries: ItemFinderListEntry[], filters: ItemFinderSectionFilters) {
  const query = normalizeFilterText(filters.query);
  const status = normalizeFilterText(filters.status);
  const category = normalizeFilterText(filters.category);
  const sort = filters.sort ?? "name";

  const filteredEntries = entries.filter((entry) => {
    const searchableText = normalizeText(
      `${entry.name} ${entry.summary} ${entry.category} ${entry.tags.join(" ")} ${entry.metadata.map((item) => item.value).join(" ")}`
    );
    const matchesQuery = query.length === 0 || searchableText.includes(query);
    const matchesStatus = status.length === 0 || status === "all" || entry.verificationStatus.toLowerCase() === status;
    const matchesCategory = category.length === 0 || category === "all" || entry.category.toLowerCase() === category;

    return matchesQuery && matchesStatus && matchesCategory;
  });

  return [...filteredEntries].sort((left, right) => {
    if (sort === "status") {
      return left.verificationStatus.localeCompare(right.verificationStatus);
    }

    if (sort === "category") {
      return left.category.localeCompare(right.category);
    }

    return left.name.localeCompare(right.name);
  });
}

const readItemFinderModel = cache(async (): Promise<ItemFinderModel> => {
  const source = await readFile(datasetPath, "utf8");
  return buildItemFinderModel(JSON.parse(source) as ItemFinderSnapshot);
});

const readOverlayContext = cache(async (userId: string): Promise<OverlayContext> => {
  const [account, memberships, fleet, model] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { preferredRoles: true },
    }),
    prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tag: true,
            focusType: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    getUserFleet(userId),
    readItemFinderModel(),
  ]);

  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    tag: membership.organization.tag,
    focusType: membership.organization.focusType,
  }));

  const preferredRoles = account?.preferredRoles ?? [];
  const normalizedPreferredRoles = preferredRoles.map((role) => normalizeText(role));
  const organizationFocusTypes = organizations.map((organization) => organization.focusType);
  const assetKeywords = uniqueStrings(
    fleet.assets.flatMap((asset) => {
      const role = normalizeText(asset.role);
      const name = normalizeText(asset.name);
      const keywords = [name, role];

      if (role.includes("mining")) keywords.push(...MINING_KEYWORDS);
      if (role.includes("cargo") || role.includes("transport") || role.includes("dropship")) keywords.push("logistics", "cargo", "transport", "hauling");
      if (role.includes("salvage")) keywords.push("salvage", "reclaim", "wreck");
      if (role.includes("medical") || role.includes("repair") || role.includes("support")) keywords.push("support", "medical", "repair");
      if (role.includes("fighter") || role.includes("combat") || role.includes("gunship") || role.includes("interceptor")) keywords.push("combat", "weapon", "armor", "security");

      return keywords;
    })
  );

  const hasMiningFleet = fleet.assets.some((asset) => asset.role.includes("MINING"));
  const hasCombatFleet = fleet.summary.combatShipCount > 0;
  const hasLogisticsFleet = fleet.summary.cargoLogisticsCount > 0;
  const hasMiningOps =
    hasMiningFleet ||
    organizationFocusTypes.includes(OrganizationFocusType.MINING) ||
    normalizedPreferredRoles.some((role) => role.includes("mining"));
  const hasCraftingGoals =
    organizationFocusTypes.some((focusType) => CRAFTING_FOCUS_TYPES.includes(focusType)) ||
    normalizedPreferredRoles.some((role) =>
      ["engineer", "cargo", "logistics", "mining", "salvage"].some((keyword) => role.includes(keyword))
    );

  const capabilities = uniqueStrings([
    hasCombatFleet ? "Combat Fleet" : "",
    hasMiningFleet ? "Mining Fleet" : "",
    hasLogisticsFleet ? "Logistics Chain" : "",
    fleet.summary.medicalSupportCount > 0 ? "Support Wing" : "",
    fleet.summary.industrialCount > 0 ? "Industrial Assets" : "",
  ]);

  const recipeResourceIds = new Set(
    Object.values(model.recipesByBlueprintId).flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.resourceId))
  );

  return {
    summary: {
      organizations,
      preferredRoles,
      capabilities,
      hasMiningOps,
      hasCraftingGoals,
    },
    hasMiningFleet,
    hasCombatFleet,
    hasLogisticsFleet,
    assetKeywords,
    recipeResourceIds,
  };
});

function buildEntryOverlays(model: ItemFinderModel, context: OverlayContext, entry: ItemFinderListEntry | Omit<ItemFinderListEntry, "overlays">): ItemFinderOverlay[] {
  const overlays: ItemFinderOverlay[] = [];
  const text = normalizeText(
    `${entry.name} ${entry.category} ${entry.summary} ${entry.tags.join(" ")} ${entry.metadata.map((item) => item.value).join(" ")}`
  );
  const recipe = getRecipeForEntity(model, entry.id);
  const miningRelevant = entry.section === "resources" || includesAnyKeyword(text, MINING_KEYWORDS);
  const craftingRelevant = entry.section === "blueprints" || entry.section === "crafting" || context.recipeResourceIds.has(entry.id) || includesAnyKeyword(text, CRAFTING_KEYWORDS);

  if (
    (context.hasMiningFleet && miningRelevant) ||
    (context.hasCombatFleet && (entry.section === "weapons" || entry.section === "armor")) ||
    (context.hasLogisticsFleet && (entry.section === "utility" || craftingRelevant)) ||
    context.assetKeywords.some((keyword) => keyword.length > 3 && text.includes(keyword))
  ) {
    overlays.push({
      kind: "fleet",
      label: "Fleet Match",
      detail: context.hasMiningFleet && miningRelevant ? "Supported by your mining-capable fleet." : "Fits your current fleet and operator capabilities.",
      tone: "cyan",
    });
  }

  if (context.summary.hasMiningOps && miningRelevant) {
    overlays.push({
      kind: "mining",
      label: "Mining Ops",
      detail: "Aligned with your mining organizations, roles, or industrial assets.",
      tone: "orange",
    });
  }

  if (context.summary.hasCraftingGoals && (craftingRelevant || Boolean(recipe))) {
    overlays.push({
      kind: "crafting",
      label: "Crafting Goal",
      detail: context.recipeResourceIds.has(entry.id)
        ? "This record feeds blueprint or fabrication workflows."
        : "Relevant to your fabrication, logistics, or engineer-oriented goals.",
      tone: "emerald",
    });
  }

  return overlays;
}

export async function getItemFinderOverview(userId: string) {
  const [model, context] = await Promise.all([readItemFinderModel(), readOverlayContext(userId)]);

  return {
    meta: model.meta,
    stats: model.stats,
    sections: ITEM_FINDER_SECTIONS,
    contextSummary: context.summary,
  };
}

export async function getItemFinderSectionPayload(userId: string, section: ItemFinderSection, filters: ItemFinderSectionFilters = {}) {
  const [model, context] = await Promise.all([readItemFinderModel(), readOverlayContext(userId)]);
  const sectionEntries = getEntitiesForSection(model, section).map((entry) => ({
    ...entry,
    overlays: buildEntryOverlays(model, context, entry),
  }));
  const entries = applySectionFilters(sectionEntries, filters);

  return {
    meta: model.meta,
    stats: model.stats,
    section,
    sectionMeta: ITEM_FINDER_SECTIONS.find((entry) => entry.id === section) ?? ITEM_FINDER_SECTIONS[0],
    entries,
    availableStatuses: Array.from(new Set(sectionEntries.map((entry) => entry.verificationStatus))).sort(),
    availableCategories: Array.from(new Set(sectionEntries.map((entry) => entry.category))).sort(),
    contextSummary: context.summary,
    filters: {
      query: filters.query ?? "",
      status: filters.status ?? "all",
      category: filters.category ?? "all",
      sort: filters.sort ?? "name",
    },
    totalEntries: sectionEntries.length,
    filteredEntries: entries.length,
  };
}

export async function getItemFinderRecordPayload(userId: string, section: ItemFinderSection, id: string) {
  const [model, context] = await Promise.all([readItemFinderModel(), readOverlayContext(userId)]);
  const entry = findEntityForSection(model, section, id);

  if (!entry) {
    return null;
  }

  return {
    meta: model.meta,
    stats: model.stats,
    section,
    sectionMeta: ITEM_FINDER_SECTIONS.find((item) => item.id === section) ?? ITEM_FINDER_SECTIONS[0],
    contextSummary: context.summary,
    entry: {
      ...entry,
      overlays: buildEntryOverlays(model, context, entry),
    },
    recipe: getRecipeForEntity(model, entry.id),
    relatedRecords: getRelatedRecords(model, entry),
  };
}