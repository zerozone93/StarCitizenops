import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.trim();
  if (!handle) return NextResponse.json({ valid: false, error: "No handle provided" });

  // Validate handle format (RSI handles are 3-60 chars, alphanumeric + underscores/hyphens)
  if (!/^[a-zA-Z0-9_-]{3,60}$/.test(handle)) {
    return NextResponse.json({ valid: false, error: "Invalid handle format" });
  }

  try {
    // Use RSI Spectrum autocomplete — no API key needed, returns members by name
    const rsiRes = await fetch("https://robertsspaceindustries.com/api/spectrum/search/member/autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "StarCitizenOps/1.0",
      },
      body: JSON.stringify({ community_id: "1", text: handle, visible_only: true }),
      signal: AbortSignal.timeout(8000),
    });

    if (!rsiRes.ok) {
      return NextResponse.json({ valid: false, error: "RSI lookup unavailable" });
    }

    const data = (await rsiRes.json()) as {
      success?: number;
      data?: {
        members?: Array<{
          moniker?: string;
          nickname?: string;
          displayname?: string;
          avatar?: string;
          signature?: string;
        }>;
      };
    };

    const members = data?.data?.members ?? [];
    const target = handle.toLowerCase();
    // RSI can return nickname (handle), moniker, or displayname depending on profile data.
    const match = members.find((m) => {
      const candidates = [m.nickname, m.moniker, m.displayname]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());
      return candidates.includes(target);
    });

    if (match) {
      const canonicalHandle = match.nickname || match.moniker || match.displayname || handle;
      return NextResponse.json({
        valid: true,
        profile: {
          moniker: canonicalHandle,
          displayname: match.displayname ?? canonicalHandle,
          avatarUrl: match.avatar ?? null,
        },
      });
    }

    return NextResponse.json({ valid: false, error: "Handle not found" });
  } catch (err) {
    // If the RSI API is unreachable, allow with a warning so users aren't blocked
    console.error("RSI handle lookup failed:", err);
    return NextResponse.json({ valid: false, error: "RSI lookup unavailable" });
  }
}
