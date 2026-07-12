import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { editMissionSuggestion } from "@/server/mission-intelligence";
import { apiError } from "@/lib/api-response";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await editMissionSuggestion(session.user.id, id, body);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
