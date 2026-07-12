import {
  logisticsCatalog,
  type CatalogEntry,
  type SubmissionCategory,
} from '../data/logistics-catalog';

type CatalogSourceHealth = {
  source: 'official' | 'community';
  provider: string;
  ok: boolean;
  detail: string;
};

type SyncedCatalogResult = {
  entries: CatalogEntry[];
  sources: CatalogSourceHealth[];
  syncedAt: string;
};

type ExternalCatalogEntry = {
  category: SubmissionCategory;
  subcategory: string;
  name: string;
  defaultUnit: string;
  aliases?: string[];
  manufacturer?: string;
  source?: 'official' | 'community' | 'curated';
};

const withTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/html;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return { ok: false as const, status: response.status, body: '' };
    }

    return { ok: true as const, status: response.status, body: await response.text() };
  } catch {
    return { ok: false as const, status: 0, body: '' };
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeCatalogEntry = (entry: ExternalCatalogEntry): CatalogEntry => ({
  category: entry.category,
  subcategory: entry.subcategory.trim(),
  name: entry.name.trim(),
  defaultUnit: entry.defaultUnit.trim(),
  aliases: entry.aliases?.map((alias) => alias.trim()).filter(Boolean),
  manufacturer: entry.manufacturer?.trim(),
  source: entry.source ?? 'community',
});

const dedupeCatalog = (entries: CatalogEntry[]) => {
  const map = new Map<string, CatalogEntry>();

  entries.forEach((entry) => {
    const key = `${entry.category}|${entry.subcategory.toLowerCase()}|${entry.name.toLowerCase()}`;

    if (!map.has(key)) {
      map.set(key, entry);
      return;
    }

    const current = map.get(key)!;
    map.set(key, {
      ...current,
      aliases: Array.from(new Set([...(current.aliases ?? []), ...(entry.aliases ?? [])])),
      manufacturer: current.manufacturer || entry.manufacturer,
      source: current.source === 'official' ? 'official' : entry.source ?? current.source,
    });
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const fetchJsonFeed = async (
  url: string,
  provider: string,
  source: 'official' | 'community'
): Promise<{ entries: CatalogEntry[]; health: CatalogSourceHealth }> => {
  const response = await withTimeout(url, 7000);

  if (!response.ok) {
    return {
      entries: [],
      health: {
        source,
        provider,
        ok: false,
        detail: response.status > 0 ? `HTTP ${response.status}` : 'unreachable',
      },
    };
  }

  try {
    const payload = JSON.parse(response.body) as { entries?: ExternalCatalogEntry[] } | ExternalCatalogEntry[];
    const incoming = Array.isArray(payload) ? payload : payload.entries ?? [];

    const normalized = incoming
      .map(normalizeCatalogEntry)
      .filter((entry) => entry.name && entry.subcategory && entry.defaultUnit);

    return {
      entries: normalized,
      health: {
        source,
        provider,
        ok: true,
        detail: `loaded ${normalized.length} entries`,
      },
    };
  } catch {
    return {
      entries: [],
      health: {
        source,
        provider,
        ok: false,
        detail: 'invalid JSON payload',
      },
    };
  }
};

const fetchCommunityMiningHints = async (): Promise<{ entries: CatalogEntry[]; health: CatalogSourceHealth }> => {
  const response = await withTimeout('https://starcitizen.tools/Mining', 7000);

  if (!response.ok) {
    return {
      entries: [],
      health: {
        source: 'community',
        provider: 'starcitizen.tools',
        ok: false,
        detail: response.status > 0 ? `HTTP ${response.status}` : 'unreachable',
      },
    };
  }

  // Lightweight extraction from page content for known ore/material names.
  const knownMiningTerms = [
    'Quantanium Ore',
    'Bexalite Ore',
    'Taranite Ore',
    'Agricium Ore',
    'Laranite Ore',
    'Borase Ore',
    'Beryl Ore',
    'Hephaestanite Ore',
    'Gold Ore',
    'Copper Ore',
    'Titanium Ore',
    'Diamond Ore',
    'Corundum Ore',
    'Aphorite',
    'Hadanite',
    'Dolivine',
  ];

  const lowerBody = response.body.toLowerCase();
  const discovered = knownMiningTerms.filter((term) => lowerBody.includes(term.toLowerCase()));

  const entries: CatalogEntry[] = discovered.map((name) => ({
    category: 'Materials',
    subcategory: name.endsWith('Ore') ? 'Raw Ore' : 'Gemstones',
    name,
    defaultUnit: 'SCU',
    source: 'community',
  }));

  return {
    entries,
    health: {
      source: 'community',
      provider: 'starcitizen.tools',
      ok: true,
      detail: `discovered ${entries.length} mining terms`,
    },
  };
};

const fetchCommunityErkulHints = async (): Promise<{ entries: CatalogEntry[]; health: CatalogSourceHealth }> => {
  const response = await withTimeout('https://www.erkul.games/live/calculator', 7000);

  if (!response.ok) {
    return {
      entries: [],
      health: {
        source: 'community',
        provider: 'erkul.games',
        ok: false,
        detail: response.status > 0 ? `HTTP ${response.status}` : 'unreachable',
      },
    };
  }

  const terms: Array<{ name: string; subcategory: string }> = [
    { name: 'P4-AR Rifle', subcategory: 'Weapons' },
    { name: 'FS-9 LMG', subcategory: 'Weapons' },
    { name: 'C54 SMG', subcategory: 'Weapons' },
    { name: 'Size 2 Shield Generator', subcategory: 'Ship Components' },
    { name: 'Size 3 Cooler', subcategory: 'Ship Components' },
  ];

  const lowerBody = response.body.toLowerCase();
  const discovered = terms.filter((term) => lowerBody.includes(term.name.toLowerCase()));

  return {
    entries: discovered.map((term) => ({
      category: 'Items',
      subcategory: term.subcategory,
      name: term.name,
      defaultUnit: 'units',
      source: 'community',
    })),
    health: {
      source: 'community',
      provider: 'erkul.games',
      ok: true,
      detail: `discovered ${discovered.length} fitting terms`,
    },
  };
};

export const syncLogisticsCatalog = async (): Promise<SyncedCatalogResult> => {
  const baseEntries = logisticsCatalog.map((entry) => ({ ...entry, source: entry.source ?? 'curated' }));
  const sourceHealth: CatalogSourceHealth[] = [];
  const externalEntries: CatalogEntry[] = [];

  const officialFeed = process.env.STARCITIZEN_CATALOG_OFFICIAL_FEED;
  const wikiFeed = process.env.STARCITIZEN_CATALOG_WIKI_FEED;
  const erkulFeed = process.env.STARCITIZEN_CATALOG_ERKUL_FEED;

  if (officialFeed) {
    const officialResult = await fetchJsonFeed(officialFeed, 'official-feed', 'official');
    sourceHealth.push(officialResult.health);
    externalEntries.push(...officialResult.entries);
  } else {
    sourceHealth.push({
      source: 'official',
      provider: 'official-feed',
      ok: false,
      detail: 'STARCITIZEN_CATALOG_OFFICIAL_FEED is not configured',
    });
  }

  if (wikiFeed) {
    const wikiResult = await fetchJsonFeed(wikiFeed, 'wiki-feed', 'community');
    sourceHealth.push(wikiResult.health);
    externalEntries.push(...wikiResult.entries);
  } else {
    const wikiHintResult = await fetchCommunityMiningHints();
    sourceHealth.push(wikiHintResult.health);
    externalEntries.push(...wikiHintResult.entries);
  }

  if (erkulFeed) {
    const erkulResult = await fetchJsonFeed(erkulFeed, 'erkul-feed', 'community');
    sourceHealth.push(erkulResult.health);
    externalEntries.push(...erkulResult.entries);
  } else {
    const erkulHintResult = await fetchCommunityErkulHints();
    sourceHealth.push(erkulHintResult.health);
    externalEntries.push(...erkulHintResult.entries);
  }

  return {
    entries: dedupeCatalog([...baseEntries, ...externalEntries]),
    sources: sourceHealth,
    syncedAt: new Date().toISOString(),
  };
};
