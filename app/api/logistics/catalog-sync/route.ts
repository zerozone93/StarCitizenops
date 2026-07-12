import { NextResponse } from 'next/server';
import { syncLogisticsCatalog } from '../../../../src/lib/catalog-sync';

export async function GET() {
  const syncResult = await syncLogisticsCatalog();

  return NextResponse.json({
    entries: syncResult.entries,
    sources: syncResult.sources,
    syncedAt: syncResult.syncedAt,
    configuredFeeds: {
      official: Boolean(process.env.STARCITIZEN_CATALOG_OFFICIAL_FEED),
      wiki: Boolean(process.env.STARCITIZEN_CATALOG_WIKI_FEED),
      erkul: Boolean(process.env.STARCITIZEN_CATALOG_ERKUL_FEED),
    },
  });
}
