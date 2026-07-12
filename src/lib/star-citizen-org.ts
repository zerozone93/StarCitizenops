type VerifyStarCitizenOrgResult = {
  verified: boolean;
  checkedAt: Date;
};

export async function verifyStarCitizenOrganizationByTag(tag: string): Promise<VerifyStarCitizenOrgResult> {
  const normalized = tag.trim().toUpperCase();
  const checkedAt = new Date();

  if (!normalized || !/^[A-Z0-9_-]{2,16}$/.test(normalized)) {
    return { verified: false, checkedAt };
  }

  try {
    const response = await fetch(`https://robertsspaceindustries.com/orgs/${encodeURIComponent(normalized)}`, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "StarCitizenOps/1.0",
      },
    });

    // RSI org profile pages resolve with HTTP 200 when the org exists.
    const verified = response.status === 200;
    return { verified, checkedAt };
  } catch {
    return { verified: false, checkedAt };
  }
}
