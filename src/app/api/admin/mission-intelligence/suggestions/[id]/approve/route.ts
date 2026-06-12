import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { approveMissionSuggestion } from "@/server/mission-intelligence";
import { apiError } from "@/lib/api-response";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await _req.json().catch(() => ({}));
    const template = await approveMissionSuggestion(session.user.id, id, body.adminNotes);
    return NextResponse.json(template);
  } catch (error) {
    return apiError(error);
  }
}
