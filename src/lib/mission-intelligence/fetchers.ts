export type FetchedItem = {
  externalId?: string;
  url?: string;
  title?: string;
  summary?: string;
  rawContent?: string;
  publishedAt?: Date;
};

/**
 * Fetches items from RSI Comm-Link RSS/API.
 * Falls back gracefully if unavailable.
 */
export async function fetchRSICommLink(): Promise<FetchedItem[]> {
  try {
    const res = await fetch("https://robertsspaceindustries.com/en/comm-link/rss", {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "StarCitizenOps-MissionIntelligence/1.0" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSSItems(text, "https://robertsspaceindustries.com/en/comm-link");
  } catch {
    return [];
  }
}

export async function fetchRSIPatchNotes(): Promise<FetchedItem[]> {
  try {
    const res = await fetch("https://robertsspaceindustries.com/en/patch-notes/rss", {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "StarCitizenOps-MissionIntelligence/1.0" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSSItems(text, "https://robertsspaceindustries.com/en/patch-notes");
  } catch {
    return [];
  }
}

export async function fetchRSIDevTracker(): Promise<FetchedItem[]> {
  try {
    const res = await fetch("https://robertsspaceindustries.com/en/community/devtracker/rss", {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "StarCitizenOps-MissionIntelligence/1.0" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSSItems(text, "https://robertsspaceindustries.com/en/community/devtracker");
  } catch {
    return [];
  }
}

function parseRSSItems(xml: string, baseUrl: string): FetchedItem[] {
  const items: FetchedItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    const guid = extractTag(block, "guid");

    if (title || link) {
      items.push({
        externalId: guid ?? link ?? undefined,
        url: link ?? baseUrl,
        title: title ?? undefined,
        summary: description ? stripHtml(description).slice(0, 1000) : undefined,
        rawContent: description ?? undefined,
        publishedAt: pubDate ? new Date(pubDate) : undefined,
      });
    }
  }

  return items.slice(0, 50);
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
