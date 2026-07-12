import type { CatalogEntry } from '../data/logistics-catalog';

type CatalogSyncResponse = {
  entries?: CatalogEntry[];
  syncedAt?: string;
  sources?: Array<{
    source: 'official' | 'community';
    provider: string;
    ok: boolean;
    detail: string;
  }>;
};

export const requestLogisticsCatalogSync = async () => {
  const fallback: { entries: CatalogEntry[]; syncedAt?: string; sources?: CatalogSyncResponse['sources'] } = {
    entries: [],
  };

  try {
    const response = await fetch('/api/logistics/catalog-sync', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as CatalogSyncResponse;

    return {
      entries: data.entries ?? [],
      syncedAt: data.syncedAt,
      sources: data.sources,
    };
  } catch {
    return fallback;
  }
};
