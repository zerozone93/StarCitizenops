import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getMailTransport } from "@/server/mail";

const TOKEN_EXPIRY_MINUTES = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const transport = getMailTransport();

  try {
    const mailInfo = await transport.sendMail({
      from: process.env.SMTP_FROM ?? '"StarCitizenOps" <noreply@starcitizenops.com>',
      to: email,
      subject: "StarCitizenOps – Password Reset",
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#f97316">StarCitizenOps – Reset Your Password</h2>
        <p>Hi ${user.name ?? "Pilot"},</p>
        <p>We received a request to reset your password. Click the link below – it expires in ${TOKEN_EXPIRY_MINUTES} minutes.</p>
        <a href="${resetLink}" style="display:inline-block;margin:1.5rem 0;padding:0.75rem 1.5rem;background:#f97316;color:#0f172a;font-weight:bold;border-radius:8px;text-decoration:none">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:0.875rem">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
        <p style="color:#64748b;font-size:0.75rem;word-break:break-all">Or copy this link: ${resetLink}</p>
      </div>
    `,
      text: `Reset your StarCitizenOps password: ${resetLink}\n\nExpires in ${TOKEN_EXPIRY_MINUTES} minutes.`,
    });

    console.info("Forgot-password email send accepted", {
      email,
      messageId: mailInfo.messageId,
      accepted: mailInfo.accepted,
      rejected: mailInfo.rejected,
      response: mailInfo.response,
    });
  } catch (error) {
    console.error("Forgot-password email send failed", error);
  }

  return NextResponse.json({ success: true });
}
