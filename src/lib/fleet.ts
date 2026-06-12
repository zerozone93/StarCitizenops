import {
  AssetStatus,
  GroundVehicle,
  MissionTemplate,
  OrganizationMemberRole,
  Ship,
  ShipRole,
  ShipSize,
  VehicleRole,
  VehicleSize,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type FleetAssetKind = "ship" | "vehicle";

export type FleetAsset = {
  kind: FleetAssetKind;
  id: string;
  userId: string;
  name: string;
  manufacturer: string;
  role: string;
  size: string;
  quantity: number;
  status: AssetStatus;
  notes: string | null;
};

export type FleetSummary = {
  totalShips: number;
  totalVehicles: number;
  availableAssetCount: number;
  roleCounts: Record<string, number>;
  sizeCounts: Record<string, number>;
  combatShipCount: number;
  cargoLogisticsCount: number;
  industrialCount: number;
  medicalSupportCount: number;
};

export const CAPABILITY_KEYS = [
  "Combat",
  "Cargo",
  "Mining",
  "Salvage",
  "Medical",
  "Refuel",
  "Repair",
  "Exploration",
  "Recon",
  "Dropship",
  "Ground Combat",
  "Logistics",
  "Capital",
  "Racing",
  "Support",
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];

function roleToCapabilities(role: string, kind: FleetAssetKind): CapabilityKey[] {
  const normalized = role.toUpperCase();
  if (kind === "vehicle") {
    if (normalized.includes("COMBAT")) return ["Ground Combat", "Combat"];
    if (normalized.includes("TRANSPORT")) return ["Logistics", "Support"];
    if (normalized.includes("MINING")) return ["Mining", "Support"];
    if (normalized.includes("EXPLORATION")) return ["Exploration", "Recon"];
    if (normalized.includes("RACING")) return ["Racing"];
    if (normalized.includes("CARGO")) return ["Cargo", "Logistics"];
    return ["Support"];
  }

  const map: Record<string, CapabilityKey[]> = {
    FIGHTER: ["Combat"],
    HEAVY_FIGHTER: ["Combat"],
    BOMBER: ["Combat"],
    INTERCEPTOR: ["Combat", "Recon"],
    GUNSHIP: ["Combat"],
    CORVETTE: ["Combat", "Capital"],
    CAPITAL: ["Capital", "Combat"],
    CARGO: ["Cargo", "Logistics"],
    MEDICAL: ["Medical", "Support"],
    REFUEL: ["Refuel", "Support"],
    REPAIR: ["Repair", "Support"],
    SALVAGE: ["Salvage", "Support"],
    MINING: ["Mining", "Support"],
    EXPLORATION: ["Exploration", "Recon"],
    SCOUT: ["Recon", "Exploration"],
    DROPSHIP: ["Dropship", "Combat", "Logistics"],
    TRANSPORT: ["Logistics", "Support"],
    RACING: ["Racing"],
    SUPPORT: ["Support"],
    MULTI_ROLE: ["Support", "Combat"],
    OTHER: ["Support"],
  };

  return map[normalized] || ["Support"];
}

function normalizeAssetName(name: string): string {
  return name.trim().toLowerCase();
}

export function flattenFleet(ships: Ship[], vehicles: GroundVehicle[]): FleetAsset[] {
  const shipAssets: FleetAsset[] = ships.map((ship) => ({
    kind: "ship",
    id: ship.id,
    userId: ship.userId,
    name: ship.name,
    manufacturer: ship.manufacturer,
    role: ship.role,
    size: ship.size,
    quantity: ship.quantity,
    status: ship.status,
    notes: ship.notes,
  }));

  const vehicleAssets: FleetAsset[] = vehicles.map((vehicle) => ({
    kind: "vehicle",
    id: vehicle.id,
    userId: vehicle.userId,
    name: vehicle.name,
    manufacturer: vehicle.manufacturer,
    role: vehicle.role,
    size: vehicle.size,
    quantity: vehicle.quantity,
    status: vehicle.status,
    notes: vehicle.notes,
  }));

  return [...shipAssets, ...vehicleAssets];
}

export function summarizeFleet(assets: FleetAsset[]): FleetSummary {
  const roleCounts: Record<string, number> = {};
  const sizeCounts: Record<string, number> = {};

  for (const asset of assets) {
    roleCounts[asset.role] = (roleCounts[asset.role] || 0) + asset.quantity;
    sizeCounts[asset.size] = (sizeCounts[asset.size] || 0) + asset.quantity;
  }

  const totalShips = assets
    .filter((asset) => asset.kind === "ship")
    .reduce((sum, asset) => sum + asset.quantity, 0);

  const totalVehicles = assets
    .filter((asset) => asset.kind === "vehicle")
    .reduce((sum, asset) => sum + asset.quantity, 0);

  const availableAssetCount = assets
    .filter((asset) => asset.status === AssetStatus.AVAILABLE)
    .reduce((sum, asset) => sum + asset.quantity, 0);

  const combatShipCount = assets
    .filter((asset) => asset.kind === "ship" && ["FIGHTER", "HEAVY_FIGHTER", "INTERCEPTOR", "GUNSHIP", "BOMBER", "CORVETTE", "CAPITAL"].includes(asset.role))
    .reduce((sum, asset) => sum + asset.quantity, 0);

  const cargoLogisticsCount = assets
    .filter((asset) => ["CARGO", "TRANSPORT", "DROPSHIP"].includes(asset.role))
    .reduce((sum, asset) => sum + asset.quantity, 0);

  const industrialCount = assets
    .filter((asset) => ["MINING", "SALVAGE"].includes(asset.role))
    .reduce((sum, asset) => sum + asset.quantity, 0);

  const medicalSupportCount = assets
    .filter((asset) => ["MEDICAL", "SUPPORT", "REFUEL", "REPAIR"].includes(asset.role))
    .reduce((sum, asset) => sum + asset.quantity, 0);

  return {
    totalShips,
    totalVehicles,
    availableAssetCount,
    roleCounts,
    sizeCounts,
    combatShipCount,
    cargoLogisticsCount,
    industrialCount,
    medicalSupportCount,
  };
}

export async function getUserFleet(userId: string) {
  const [ships, vehicles] = await Promise.all([
    prisma.ship.findMany({
      where: { userId },
      orderBy: [{ name: "asc" }, { status: "asc" }],
    }),
    prisma.groundVehicle.findMany({
      where: { userId },
      orderBy: [{ name: "asc" }, { status: "asc" }],
    }),
  ]);

  const assets = flattenFleet(ships, vehicles);
  return {
    ships,
    vehicles,
    assets,
    summary: summarizeFleet(assets),
  };
}

export async function calculateOrgFleetReadiness(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: { userId: true },
  });

  const memberIds = members.map((member) => member.userId);

  const [ships, vehicles] = await Promise.all([
    prisma.ship.findMany({
      where: {
        userId: { in: memberIds },
      },
    }),
    prisma.groundVehicle.findMany({
      where: {
        userId: { in: memberIds },
      },
    }),
  ]);

  const assets = flattenFleet(ships, vehicles);
  const summary = summarizeFleet(assets);

  const capabilityCounts: Record<CapabilityKey, number> = {
    Combat: 0,
    Cargo: 0,
    Mining: 0,
    Salvage: 0,
    Medical: 0,
    Refuel: 0,
    Repair: 0,
    Exploration: 0,
    Recon: 0,
    Dropship: 0,
    "Ground Combat": 0,
    Logistics: 0,
    Capital: 0,
    Racing: 0,
    Support: 0,
  };

  for (const asset of assets) {
    for (const capability of roleToCapabilities(asset.role, asset.kind)) {
      capabilityCounts[capability] += asset.quantity;
    }
  }

  const missingCapabilities = CAPABILITY_KEYS.filter(
    (capability) => capabilityCounts[capability] === 0
  );

  const recommendedMissionTypes: string[] = [];
  if (capabilityCounts.Mining > 0) recommendedMissionTypes.push("Mining Operations");
  if (capabilityCounts.Salvage > 0) recommendedMissionTypes.push("Salvage Operations");
  if (capabilityCounts.Medical > 0) recommendedMissionTypes.push("Medical and Rescue");
  if (capabilityCounts.Cargo > 0 || capabilityCounts.Logistics > 0)
    recommendedMissionTypes.push("Cargo and Logistics");
  if (capabilityCounts.Combat > 0) recommendedMissionTypes.push("Combat Operations");
  if (capabilityCounts.Exploration > 0 || capabilityCounts.Recon > 0)
    recommendedMissionTypes.push("Exploration and Recon");

  return {
    totalShips: summary.totalShips,
    totalVehicles: summary.totalVehicles,
    roleCounts: summary.roleCounts,
    sizeCounts: summary.sizeCounts,
    availableAssetCount: summary.availableAssetCount,
    capabilityCounts,
    missingCapabilities,
    recommendedMissionTypes,
  };
}

function parseRequirementQuantity(requirement: string) {
  const matched = requirement.trim().match(/^(\d+)\s+/);
  if (!matched) return 1;
  const value = Number(matched[1]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function compareFleetToMissionRequirements(
  fleetAssets: FleetAsset[],
  missionTemplate: Pick<MissionTemplate, "requiredAssets" | "optionalAssets">
) {
  const matches: string[] = [];
  const missingRequiredAssets: string[] = [];
  const missingOptionalAssets: string[] = [];

  for (const requirement of missionTemplate.requiredAssets) {
    const needed = parseRequirementQuantity(requirement);
    const normalizedReq = normalizeAssetName(requirement.replace(/^\d+\s+/, ""));

    const available = fleetAssets
      .filter((asset) => normalizeAssetName(asset.name).includes(normalizedReq) || normalizeAssetName(asset.role).includes(normalizedReq))
      .reduce((sum, asset) => sum + asset.quantity, 0);

    if (available >= needed) {
      matches.push(`${requirement} (have ${available})`);
    } else {
      missingRequiredAssets.push(`${requirement} (need ${needed - available} more)`);
    }
  }

  for (const optional of missionTemplate.optionalAssets) {
    const normalized = normalizeAssetName(optional.replace(/^\d+\s+/, ""));
    const available = fleetAssets
      .filter((asset) => normalizeAssetName(asset.name).includes(normalized) || normalizeAssetName(asset.role).includes(normalized))
      .reduce((sum, asset) => sum + asset.quantity, 0);

    if (available === 0) {
      missingOptionalAssets.push(optional);
    }
  }

  const totalRequired = missionTemplate.requiredAssets.length;
  const coveredRequired = totalRequired - missingRequiredAssets.length;
  const readinessScore = totalRequired === 0 ? 100 : Math.round((coveredRequired / totalRequired) * 100);

  const readyStatus =
    missingRequiredAssets.length === 0
      ? "Ready"
      : coveredRequired > 0
      ? "Partially ready"
      : "Missing key assets";

  return {
    readyStatus,
    matchingAssets: matches,
    missingRequiredAssets,
    missingOptionalAssets,
    recommendedSubstitutes: missingRequiredAssets.map(
      (item) => `${item} - consider multi-role alternatives or reduced mission scale`
    ),
    readinessScore,
  };
}

export async function recommendMissionsForFleet(userId: string) {
  const [fleet, memberships, categories] = await Promise.all([
    getUserFleet(userId),
    prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
    }),
    prisma.missionCategory.findMany({ include: { templates: true } }),
  ]);

  const roleTotals = fleet.summary.roleCounts;

  const categoryScores: Record<string, number> = {};
  for (const category of categories) {
    categoryScores[category.id] = 0;
  }

  const addScoreBySlug = (slug: string, score: number) => {
    const category = categories.find((item) => item.slug === slug);
    if (category) categoryScores[category.id] += score;
  };

  const fighterCount = (roleTotals.FIGHTER || 0) + (roleTotals.HEAVY_FIGHTER || 0);
  if (fighterCount > 0) addScoreBySlug("combat-operations", fighterCount * 2);

  const cargoCount = (roleTotals.CARGO || 0) + (roleTotals.TRANSPORT || 0);
  if (cargoCount > 0) addScoreBySlug("cargo-and-logistics", cargoCount * 2);

  const miningCount = roleTotals.MINING || 0;
  if (miningCount > 0) addScoreBySlug("mining-operations", miningCount * 2);

  const salvageCount = roleTotals.SALVAGE || 0;
  if (salvageCount > 0) addScoreBySlug("salvage-operations", salvageCount * 2);

  const medicalCount = roleTotals.MEDICAL || 0;
  if (medicalCount > 0) addScoreBySlug("medical-and-rescue", medicalCount * 2);

  const explorationCount = (roleTotals.EXPLORATION || 0) + (roleTotals.SCOUT || 0);
  if (explorationCount > 0) addScoreBySlug("exploration-and-recon", explorationCount * 2);

  const dropshipCount = roleTotals.DROPSHIP || 0;
  if (dropshipCount > 0) {
    addScoreBySlug("ground-operations", dropshipCount * 2);
    addScoreBySlug("security-and-escort", dropshipCount);
  }

  const bonus = memberships.length > 0 ? 1 : 0;

  return categories
    .map((category) => ({
      category,
      score: categoryScores[category.id] + bonus,
    }))
    .sort((a, b) => b.score - a.score)
    .flatMap(({ category }) => category.templates.slice(0, 4));
}

export function isPrivilegedOrgRole(role: OrganizationMemberRole) {
  const privileged: OrganizationMemberRole[] = [OrganizationMemberRole.OWNER, OrganizationMemberRole.OFFICER, OrganizationMemberRole.TEAM_LEADER];
  return privileged.includes(role);
}

export function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  if (value < 1) return 1;
  if (value > 999) return 999;
  return Math.trunc(value);
}

export function toShipSize(input: string): ShipSize {
  const upper = input.toUpperCase();
  return (ShipSize[upper as keyof typeof ShipSize] || ShipSize.SMALL) as ShipSize;
}

export function toVehicleSize(input: string): VehicleSize {
  const upper = input.toUpperCase();
  return (VehicleSize[upper as keyof typeof VehicleSize] || VehicleSize.SMALL) as VehicleSize;
}

export function toShipRole(input: string): ShipRole {
  const upper = input.toUpperCase();
  return (ShipRole[upper as keyof typeof ShipRole] || ShipRole.OTHER) as ShipRole;
}

export function toVehicleRole(input: string): VehicleRole {
  const upper = input.toUpperCase();
  return (VehicleRole[upper as keyof typeof VehicleRole] || VehicleRole.OTHER) as VehicleRole;
}

export function toAssetStatus(input: string): AssetStatus {
  const upper = input.toUpperCase();
  return (AssetStatus[upper as keyof typeof AssetStatus] || AssetStatus.UNKNOWN) as AssetStatus;
}
