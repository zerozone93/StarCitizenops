import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { sendEmailOTP } from "@/server/two-factor";

// POST - send email OTP code to the logged-in user
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendEmailOTP(session.user.id, session.user.email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send code. Please try again." }, { status: 500 });
  }
}
