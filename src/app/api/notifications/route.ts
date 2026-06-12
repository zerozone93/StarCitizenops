import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listNotifications, markAllNotificationsRead } from "@/server/notifications";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await listNotifications(session.user.id);
  return NextResponse.json(notifications);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllNotificationsRead(session.user.id);
  return NextResponse.json({ ok: true });
}
