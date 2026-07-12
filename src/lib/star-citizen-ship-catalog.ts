import { ShipRole, ShipSize } from "@prisma/client";
import { STAR_CITIZEN_SHIPS, type StarCitizenShip } from "@/data/starCitizenShips";

const SHIP_CATALOG_REVALIDATE_SECONDS = 60 * 60 * 24 * 14;

type WikiVehicle = {
  name?: string;
  game_name?: string;
  sizes?: {
    length?: number;
  };
};

type ToolsCategoryResponse = {
  continue?: {
    cmcontinue?: string;
  };
  query?: {
    categorymembers?: Array<{
      title?: string;
    }>;
  };
};

type WikiVehiclesResponse = {
  data?: WikiVehicle[];
};

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function inferSizeByLength(length?: number): ShipSize {
  if (!Number.isFinite(length)) return ShipSize.MEDIUM;
  if ((length as number) < 8) return ShipSize.SNUB;
  if ((length as number) < 30) return ShipSize.SMALL;
  if ((length as number) < 70) return ShipSize.MEDIUM;
  if ((length as number) < 150) return ShipSize.LARGE;
  return ShipSize.CAPITAL;
}

function inferRoleByName(name: string): ShipRole {
  const n = name.toLowerCase();
  if (/gunship|assault|redeemer|hammerhead|perseus/.test(n)) return ShipRole.GUNSHIP;
  if (/cargo|freight|hauler|hull|ironclad/.test(n)) return ShipRole.CARGO;
  if (/medical|medivac|apollo|rescue/.test(n)) return ShipRole.MEDICAL;
  if (/mining|prospector|mole/.test(n)) return ShipRole.MINING;
  if (/salvage|reclaimer|vulture/.test(n)) return ShipRole.SALVAGE;
  if (/exploration|scout|recon|carrack|odyssey/.test(n)) return ShipRole.EXPLORATION;
  if (/interceptor|mantis/.test(n)) return ShipRole.INTERCEPTOR;
  if (/bomber|eclipse|retaliator|a2|inferno/.test(n)) return ShipRole.BOMBER;
  if (/fighter|hornet|arrow|gladius|sabre|scorpius/.test(n)) return ShipRole.FIGHTER;
  if (/capital|idris|javelin|kraken|polaris/.test(n)) return ShipRole.CAPITAL;
  return ShipRole.OTHER;
}

function inferManufacturer(name: string, gameName?: string) {
  if (gameName && gameName.toLowerCase().endsWith(name.toLowerCase())) {
    const manufacturer = gameName.slice(0, Math.max(0, gameName.length - name.length)).trim();
    if (manufacturer.length) return manufacturer;
  }
  return "Unknown";
}

async function fetchToolsShipNames() {
  const names = new Set<string>();
  let cmcontinue: string | null = null;
  let safetyCounter = 0;

  while (safetyCounter < 30) {
    safetyCounter += 1;
    const query = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: "Category:Ships",
      cmlimit: "500",
      format: "json",
    });

    if (cmcontinue) {
      query.set("cmcontinue", cmcontinue);
    }

    const response = await fetch(`https://starcitizen.tools/api.php?${query.toString()}`, {
      next: { revalidate: SHIP_CATALOG_REVALIDATE_SECONDS },
    });

    if (!response.ok) break;
    const payload = (await response.json()) as ToolsCategoryResponse;

    for (const row of payload.query?.categorymembers || []) {
      if (!row.title) continue;
      names.add(normalizeName(row.title));
    }

    cmcontinue = payload.continue?.cmcontinue || null;
    if (!cmcontinue) break;
  }

  return names;
}

async function fetchWikiVehicles() {
  const response = await fetch("https://api.star-citizen.wiki/api/v2/vehicles?limit=2000", {
    next: { revalidate: SHIP_CATALOG_REVALIDATE_SECONDS },
  });

  if (!response.ok) return [] as WikiVehicle[];
  const payload = (await response.json()) as WikiVehiclesResponse;
  return payload.data || [];
}

export async function getStarCitizenShipCatalog(): Promise<StarCitizenShip[]> {
  const shipMap = new Map<string, StarCitizenShip>();

  for (const ship of STAR_CITIZEN_SHIPS) {
    shipMap.set(ship.name.toLowerCase(), ship);
  }

  // Required immediate corrections from latest known lineup.
  shipMap.set("ironclad", {
    name: "Ironclad",
    manufacturer: "Drake",
    role: ShipRole.CARGO,
    size: ShipSize.LARGE,
  });
  shipMap.set("ironclad assault", {
    name: "Ironclad Assault",
    manufacturer: "Drake",
    role: ShipRole.GUNSHIP,
    size: ShipSize.LARGE,
  });

  const [toolsNames, wikiVehicles] = await Promise.all([fetchToolsShipNames(), fetchWikiVehicles()]);

  for (const vehicle of wikiVehicles) {
    const rawName = vehicle.name?.trim();
    if (!rawName) continue;
    const key = rawName.toLowerCase();
    if (shipMap.has(key)) continue;

    shipMap.set(key, {
      name: normalizeName(rawName),
      manufacturer: inferManufacturer(rawName, vehicle.game_name),
      role: inferRoleByName(rawName),
      size: inferSizeByLength(vehicle.sizes?.length),
    });
  }

  for (const name of toolsNames) {
    const key = name.toLowerCase();
    if (shipMap.has(key)) continue;

    shipMap.set(key, {
      name,
      manufacturer: "Unknown",
      role: inferRoleByName(name),
      size: ShipSize.MEDIUM,
    });
  }

  return Array.from(shipMap.values()).sort((a, b) => {
    const m = a.manufacturer.localeCompare(b.manufacturer);
    if (m !== 0) return m;
    return a.name.localeCompare(b.name);
  });
}

export async function refreshStarCitizenShipCatalog() {
  const ships = await getStarCitizenShipCatalog();
  return {
    count: ships.length,
    refreshedAt: new Date().toISOString(),
  };
}
