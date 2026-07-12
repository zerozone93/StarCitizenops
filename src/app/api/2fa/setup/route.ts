import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { generateTOTPSecret, generateTOTPQRCode } from "@/server/two-factor";
import { prisma } from "@/lib/prisma";

// GET - generate a new TOTP secret and return QR code (does NOT yet enable 2FA)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { secret, otpAuthUrl } = generateTOTPSecret(session.user.email);
  const qrCode = await generateTOTPQRCode(otpAuthUrl);

  // Temporarily store the pending secret so we can verify it
  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret },
  });

  return NextResponse.json({ secret, qrCode });
}
