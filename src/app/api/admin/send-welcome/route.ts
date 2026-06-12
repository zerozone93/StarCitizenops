import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/server/mail";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const expected = process.env.WELCOME_RESEND_TOKEN?.trim() || "";

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "").trim() || undefined;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  try {
    const mailInfo = await sendWelcomeEmail(email, name);
    console.info("Manual welcome email send accepted", {
      email,
      messageId: mailInfo.messageId,
      accepted: mailInfo.accepted,
      rejected: mailInfo.rejected,
      response: mailInfo.response,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual welcome email send failed", error);
    return NextResponse.json({ error: "Failed to send welcome email." }, { status: 500 });
  }
}
