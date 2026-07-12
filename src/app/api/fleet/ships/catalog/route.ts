import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStarCitizenShipCatalog } from "@/lib/star-citizen-ship-catalog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ships = await getStarCitizenShipCatalog();
  return NextResponse.json({
    dataVersion: "dynamic-14d",
    count: ships.length,
    ships,
  });
}
