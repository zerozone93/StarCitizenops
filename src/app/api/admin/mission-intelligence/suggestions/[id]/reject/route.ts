import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rejectMissionSuggestion } from "@/server/mission-intelligence";
import { apiError } from "@/lib/api-response";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await rejectMissionSuggestion(session.user.id, id, body.adminNotes ?? "");
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
