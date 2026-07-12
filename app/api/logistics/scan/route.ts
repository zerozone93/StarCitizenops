import { NextResponse } from 'next/server';

type ScanContext = 'offer' | 'request' | 'inventory';

type ScanLineItem = {
  category: string;
  subcategory: string;
  name: string;
  quantity: string;
  unit: string;
};

type ScanPayload = {
  context: ScanContext;
  hasScreenshot: boolean;
  title?: string;
  materialName?: string;
  category?: string;
  lineItems?: ScanLineItem[];
  note?: string;
};

const endpoint = process.env.STARCITIZENOPPS_AI_ENDPOINT;
const apiKey = process.env.STARCITIZENOPPS_AI_KEY;

const localFallbackVerdict = (payload: ScanPayload) => {
  if (payload.context === 'offer') {
    const lineCount = payload.lineItems?.length ?? 0;
    return payload.hasScreenshot
      ? `AI scan matched ${lineCount} delivered item line${lineCount === 1 ? '' : 's'}.`
      : `AI scan needs a screenshot before it can confirm this stock offer.`;
  }

  if (payload.context === 'request') {
    const lineCount = payload.lineItems?.length ?? 0;
    return `AI scan marked this as a stock request for admin handling (${lineCount} line${lineCount === 1 ? '' : 's'}).`;
  }

  return payload.hasScreenshot
    ? `AI scan matched ${payload.materialName || 'the stock item'} to the ${payload.category || 'inventory'} record.`
    : 'AI scan needs a screenshot before it can place this stock item.';
};

const getExternalVerdict = async (payload: ScanPayload) => {
  if (!endpoint || !apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        task: 'logistics_scan_verdict',
        source: 'star-citizen-ops-logistics',
        payload,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      verdict?: string;
      message?: string;
      output?: { verdict?: string };
      result?: { verdict?: string };
    };

    return data.verdict || data.message || data.output?.verdict || data.result?.verdict || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export async function GET() {
  return NextResponse.json({
    provider: 'starcitizenopps',
    configured: Boolean(endpoint && apiKey),
  });
}

export async function POST(request: Request) {
  let payload: ScanPayload;

  try {
    payload = (await request.json()) as ScanPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!payload || !payload.context) {
    return NextResponse.json({ error: 'Missing required scan context.' }, { status: 400 });
  }

  const externalVerdict = await getExternalVerdict(payload);
  const verdict = externalVerdict || localFallbackVerdict(payload);

  return NextResponse.json({
    verdict,
    provider: externalVerdict ? 'starcitizenopps' : 'local-fallback',
    configured: Boolean(endpoint && apiKey),
  });
}
