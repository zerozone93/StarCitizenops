export type ItemFinderSection = "mining" | "blueprints" | "crafting" | "armor" | "weapons" | "utility";

export type ItemFinderSnapshot = {
  meta: {
    generatedAt: string;
    sourceCount: number;
    notes?: string[];
  };
  systems?: Array<{ id?: string; slug?: string; name: string }>;
  locations?: Array<Record<string, unknown>>;
  resources?: Array<Record<string, unknown>>;
  utility?: Array<Record<string, unknown>>;
  tools?: Array<Record<string, unknown>>;
  vendors?: Array<Record<string, unknown>>;
  blueprints?: Array<Record<string, unknown>>;
  recipes?: Array<Record<string, unknown>>;
  weapons?: Array<Record<string, unknown>>;
  armor?: Array<Record<string, unknown>>;
};

export type ItemFinderLocation = {
  id: string;
  name: string;
  systemId: string;
  locationType: string;
  parent?: string;
};

export type ItemFinderStore = {
  id: string;
  name: string;
  category: string;
  locationId: string;
  subLocation?: string;
  products: string[];
  verificationStatus: string;
};

export type ItemFinderRecipe = {
  id: string;
  blueprintId: string;
  outputItemId: string;
  ingredients: Array<{
    resourceId: string;
    amount: number;
    unit: string;
  }>;
  verificationStatus: string;
};

export type ItemFinderEntity = {
  id: string;
  name: string;
  section: Exclude<ItemFinderSection, "mining"> | "resources";
  category: string;
  summary: string;
  verificationStatus: string;
  tags: string[];
  metadata: Array<{ label: string; value: string }>;
  relatedIds: string[];
  imageUrl?: string;
};

export type ItemFinderModel = {
  meta: ItemFinderSnapshot["meta"];
  entities: ItemFinderEntity[];
  miningIds: string[];
  locationsById: Record<string, ItemFinderLocation>;
  storesById: Record<string, ItemFinderStore>;
  recipesByBlueprintId: Record<string, ItemFinderRecipe>;
  stats: Array<{ id: ItemFinderSection; label: string; value: number }>;
};

export type ItemFinderOverlay = {
  kind: "fleet" | "mining" | "crafting";
  label: string;
  detail: string;
  tone: "orange" | "cyan" | "emerald";
};

export type ItemFinderListEntry = ItemFinderEntity & {
  overlays: ItemFinderOverlay[];
};

export type ItemFinderContextSummary = {
  organizations: Array<{
    id: string;
    name: string;
    tag: string;
    focusType: string;
  }>;
  preferredRoles: string[];
  capabilities: string[];
  hasMiningOps: boolean;
  hasCraftingGoals: boolean;
};

export type ItemFinderRelatedRecord =
  | ({ recordType: "entity" } & ItemFinderEntity)
  | ({ recordType: "location" } & ItemFinderLocation)
  | ({ recordType: "store" } & ItemFinderStore);

export const ITEM_FINDER_SECTIONS: Array<{
  id: ItemFinderSection;
  label: string;
  description: string;
}> = [
  { id: "mining", label: "Mining", description: "Ore, gems, and extraction resource leads" },
  { id: "blueprints", label: "Blueprints", description: "Blueprint acquisition and fabrication records" },
  { id: "crafting", label: "Crafting", description: "Recipe inputs and output item breakdowns" },
  { id: "armor", label: "Armor", description: "Protective suits, gear, and location leads" },
  { id: "weapons", label: "Weapons", description: "Weapon catalogs and acquisition routes" },
  { id: "utility", label: "Utility", description: "Tools, attachments, and support equipment" },
];

export function formatItemFinderLabel(value: string) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function toneForVerificationStatus(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("verified") || normalized.includes("confirmed")) {
    return "emerald" as const;
  }

  if (normalized.includes("pending") || normalized.includes("snapshot")) {
    return "amber" as const;
  }

  return "cyan" as const;
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function toStringValue(value: unknown, fallback: string) {
  const nextValue = String(value ?? "").trim();
  return nextValue.length > 0 ? nextValue : fallback;
}

function buildSummary(value: unknown, fallback: string) {
  const nextValue = String(value ?? "").trim();
  return nextValue.length > 0 ? nextValue : fallback;
}

function inferMiningIds(resources: ItemFinderEntity[]) {
  return resources
    .filter((entry) => /mine|mining|ore|gem|raw|quantanium|hadanite|janalite|taranite|bexalite|borase|agricium/i.test(`${entry.name} ${entry.category} ${entry.summary} ${entry.tags.join(" ")}`))
    .map((entry) => entry.id);
}

export function buildItemFinderModel(snapshot: ItemFinderSnapshot): ItemFinderModel {
  const locations = (snapshot.locations ?? []).map((entry, index) => ({
    id: toStringValue(entry.id ?? entry.slug, `location-${index + 1}`),
    name: toStringValue(entry.name, `Location ${index + 1}`),
    systemId: toStringValue(entry.systemId ?? entry.system, "unknown"),
    locationType: toStringValue(entry.locationType ?? entry.type, "location"),
    parent: entry.parent ? String(entry.parent) : undefined,
  }));

  const stores = (snapshot.vendors ?? []).map((entry, index) => ({
    id: toStringValue(entry.id ?? entry.slug, `vendor-${index + 1}`),
    name: toStringValue(entry.name, `Vendor ${index + 1}`),
    category: toStringValue(entry.category, "vendor"),
    locationId: toStringValue(entry.locationId ?? entry.location, "unknown"),
    subLocation: entry.subLocation ? String(entry.subLocation) : undefined,
    products: toStringArray(entry.products),
    verificationStatus: toStringValue(entry.verificationStatus, "snapshot_imported"),
  }));

  const recipes = (snapshot.recipes ?? []).map((entry, index) => ({
    id: toStringValue(entry.id, `recipe-${index + 1}`),
    blueprintId: toStringValue(entry.blueprintId, `blueprint-${index + 1}`),
    outputItemId: toStringValue(entry.outputItemId ?? entry.outputId, `output-${index + 1}`),
    ingredients: Array.isArray(entry.ingredients)
      ? entry.ingredients.map((ingredient, ingredientIndex) => ({
          resourceId: toStringValue((ingredient as Record<string, unknown>).resourceId, `resource-${ingredientIndex + 1}`),
          amount: Number((ingredient as Record<string, unknown>).amount ?? 1),
          unit: toStringValue((ingredient as Record<string, unknown>).unit, "unit"),
        }))
      : [],
    verificationStatus: toStringValue(entry.verificationStatus, "snapshot_imported"),
  }));

  const recipesByBlueprintId = Object.fromEntries(recipes.map((entry) => [entry.blueprintId, entry]));

  const resourceEntities = (snapshot.resources ?? []).map((entry, index) => ({
    id: toStringValue(entry.id ?? entry.slug, `resource-${index + 1}`),
    name: toStringValue(entry.name, `Resource ${index + 1}`),
    section: "resources" as const,
    category: formatItemFinderLabel(toStringValue(entry.category, "imported_resource")),
    summary: buildSummary(entry.description ?? entry.sourceNotes, "Operational resource record available."),
    verificationStatus: toStringValue(entry.verificationStatus, "snapshot_imported"),
    tags: toStringArray(entry.miningMethods ?? entry.environments).map(formatItemFinderLabel),
    metadata: [
      { label: "Category", value: formatItemFinderLabel(toStringValue(entry.category, "imported_resource")) },
      { label: "Mining", value: toStringArray(entry.miningMethods ?? entry.environments).map(formatItemFinderLabel).join(", ") || "Unknown" },
      { label: "Locations", value: String(toStringArray(entry.knownLocations).length) },
      { label: "Buy At", value: String(toStringArray(entry.purchaseLocations).length) },
    ],
    relatedIds: uniqueStrings([...toStringArray(entry.knownLocations), ...toStringArray(entry.purchaseLocations)]),
    imageUrl: entry.imageUrl ? String(entry.imageUrl) : undefined,
  }));

  const armorEntities = (snapshot.armor ?? []).map((entry, index) => ({
    id: toStringValue(entry.id ?? entry.slug, `armor-${index + 1}`),
    name: toStringValue(entry.name, `Armor ${index + 1}`),
    section: "armor" as const,
    category: formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "unknown")),
    summary: buildSummary(entry.description, "Protective gear and loadout record."),
    verificationStatus: toStringValue(entry.verificationStatus, "snapshot_imported"),
    tags: [
      formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "unknown")),
      ...toStringArray(entry.recommendedFor).slice(0, 2).map(formatItemFinderLabel),
    ],
    metadata: [
      { label: "Class", value: formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "unknown")) },
      { label: "Maker", value: toStringValue(entry.manufacturer, "Unknown") },
      { label: "Buy At", value: String(toStringArray(entry.purchaseLocations).length) },
      { label: "Found At", value: String(toStringArray(entry.foundLocations).length) },
    ],
    relatedIds: uniqueStrings([...toStringArray(entry.purchaseLocations), ...toStringArray(entry.foundLocations)]),
    imageUrl: entry.imageUrl ? String(entry.imageUrl) : undefined,
  }));

  const weaponEntities = (snapshot.weapons ?? []).map((entry, index) => ({
    id: toStringValue(entry.id ?? entry.slug, `weapon-${index + 1}`),
    name: toStringValue(entry.name, `Weapon ${index + 1}`),
    section: "weapons" as const,
    category: formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "unknown")),
    summary: buildSummary(entry.description, "Weapon platform and acquisition record."),
    verificationStatus: toStringValue(entry.verificationStatus, "snapshot_imported"),
    tags: [
      formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "unknown")),
      formatItemFinderLabel(toStringValue(entry.damageType, "unknown")),
    ],
    metadata: [
      { label: "Class", value: formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "unknown")) },
      { label: "Damage", value: formatItemFinderLabel(toStringValue(entry.damageType, "unknown")) },
      { label: "Buy At", value: String(toStringArray(entry.purchaseLocations).length) },
      { label: "Found At", value: String(toStringArray(entry.foundLocations).length) },
    ],
    relatedIds: uniqueStrings([...toStringArray(entry.purchaseLocations), ...toStringArray(entry.foundLocations)]),
    imageUrl: entry.imageUrl ? String(entry.imageUrl) : undefined,
  }));

  const utilityEntities = (snapshot.utility ?? snapshot.tools ?? []).map((entry, index) => ({
    id: toStringValue(entry.id ?? entry.slug, `utility-${index + 1}`),
    name: toStringValue(entry.name, `Utility ${index + 1}`),
    section: "utility" as const,
    category: formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "utility")),
    summary: buildSummary(entry.description, "Support equipment and specialist tool entry."),
    verificationStatus: toStringValue(entry.verificationStatus, "snapshot_imported"),
    tags: [
      formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "utility")),
      formatItemFinderLabel(toStringValue(entry.utilityType ?? entry.type, "support")),
    ],
    metadata: [
      { label: "Category", value: formatItemFinderLabel(toStringValue(entry.class ?? entry.category, "utility")) },
      { label: "Type", value: formatItemFinderLabel(toStringValue(entry.utilityType ?? entry.type, "support")) },
      { label: "Buy At", value: String(toStringArray(entry.purchaseLocations).length) },
      { label: "Found At", value: String(toStringArray(entry.foundLocations).length) },
    ],
    relatedIds: uniqueStrings([...toStringArray(entry.purchaseLocations), ...toStringArray(entry.foundLocations)]),
  }));

  const blueprintEntities = (snapshot.blueprints ?? []).map((entry, index) => ({
    id: toStringValue(entry.id ?? entry.slug, `blueprint-${index + 1}`),
    name: toStringValue(entry.name, `Blueprint ${index + 1}`),
    section: "blueprints" as const,
    category: formatItemFinderLabel(toStringValue(entry.craftsCategory ?? entry.category, "general")),
    summary: `Fabricator-ready blueprint for ${formatItemFinderLabel(toStringValue(entry.craftsCategory ?? entry.category, "general"))}.`,
    verificationStatus: toStringValue(entry.verificationStatus, "snapshot_imported"),
    tags: toStringArray(entry.acquisitionHints).map(formatItemFinderLabel),
    metadata: [
      { label: "Fabricator", value: formatItemFinderLabel(toStringValue(entry.fabricatorType, "item_fabricator")) },
      { label: "Category", value: formatItemFinderLabel(toStringValue(entry.craftsCategory ?? entry.category, "general")) },
      { label: "Acquire", value: toStringArray(entry.acquisitionHints).map(formatItemFinderLabel).join(", ") || "Unknown" },
    ],
    relatedIds: uniqueStrings(Object.values(recipesByBlueprintId[toStringValue(entry.id ?? entry.slug, `blueprint-${index + 1}`)]?.ingredients ?? {}).map((ingredient) => ingredient.resourceId)),
  }));

  const craftingEntities = recipes.map((entry) => ({
    id: entry.blueprintId,
    name: formatItemFinderLabel(entry.outputItemId),
    section: "crafting" as const,
    category: blueprintEntities.find((blueprint) => blueprint.id === entry.blueprintId)?.category ?? "Craftable Item",
    summary: `Craftable item requiring ${entry.ingredients.length} resources.`,
    verificationStatus: entry.verificationStatus,
    tags: entry.ingredients.slice(0, 3).map((ingredient) => `${formatItemFinderLabel(ingredient.resourceId)} ${ingredient.amount} ${ingredient.unit}`.trim()),
    metadata: [
      { label: "Blueprint", value: blueprintEntities.find((blueprint) => blueprint.id === entry.blueprintId)?.name ?? formatItemFinderLabel(entry.blueprintId) },
      { label: "Resources", value: entry.ingredients.map((ingredient) => formatItemFinderLabel(ingredient.resourceId)).join(", ") || "Unknown" },
      { label: "Ingredients", value: String(entry.ingredients.length) },
    ],
    relatedIds: uniqueStrings([entry.outputItemId, ...entry.ingredients.map((ingredient) => ingredient.resourceId)]),
  }));

  const entities = [
    ...resourceEntities,
    ...blueprintEntities,
    ...craftingEntities,
    ...armorEntities,
    ...weaponEntities,
    ...utilityEntities,
  ];

  const miningIds = inferMiningIds(resourceEntities);

  const locationsById = Object.fromEntries(locations.map((entry) => [entry.id, entry]));
  const storesById = Object.fromEntries(stores.map((entry) => [entry.id, entry]));

  const stats = ITEM_FINDER_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    value: getEntitiesForSection({ meta: snapshot.meta, entities, miningIds, locationsById, storesById, recipesByBlueprintId, stats: [] }, section.id).length,
  }));

  return {
    meta: snapshot.meta,
    entities,
    miningIds,
    locationsById,
    storesById,
    recipesByBlueprintId,
    stats,
  };
}

export function getEntitiesForSection(model: ItemFinderModel, section: ItemFinderSection) {
  if (section === "mining") {
    return model.entities.filter((entry) => entry.section === "resources" && model.miningIds.includes(entry.id));
  }

  return model.entities.filter((entry) => entry.section === section);
}

export function findEntityForSection(model: ItemFinderModel, section: ItemFinderSection, id: string) {
  return getEntitiesForSection(model, section).find((entry) => entry.id === id) ?? null;
}

export function getRouteSectionForEntity(entry: ItemFinderEntity) {
  return entry.section === "resources" ? "mining" : entry.section;
}

export function getRecipeForEntity(model: ItemFinderModel, entityId: string) {
  return model.recipesByBlueprintId[entityId];
}

export function getLocationName(model: ItemFinderModel, locationId: string) {
  return model.locationsById[locationId]?.name ?? formatItemFinderLabel(locationId);
}

export function getRelatedRecords(model: ItemFinderModel, entity: ItemFinderEntity): ItemFinderRelatedRecord[] {
  const entityById = Object.fromEntries(model.entities.map((entry) => [entry.id, entry]));
  const related: ItemFinderRelatedRecord[] = [];

  for (const relatedId of entity.relatedIds) {
    const matchingEntity = entityById[relatedId];
    if (matchingEntity) {
      related.push({ ...matchingEntity, recordType: "entity" });
      continue;
    }

    const matchingLocation = model.locationsById[relatedId];
    if (matchingLocation) {
      related.push({ ...matchingLocation, recordType: "location" });
      continue;
    }

    const matchingStore = model.storesById[relatedId];
    if (matchingStore) {
      related.push({ ...matchingStore, recordType: "store" });
    }
  }

  return related;
}