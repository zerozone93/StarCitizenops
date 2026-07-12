import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getMailTransport } from "@/server/mail";

const APP_NAME = "StarCitizenOps";
const OTP_WINDOW = 1; // allow 1 step either side of current time
const EMAIL_CODE_EXPIRY_MINUTES = 10;

// ─── TOTP (Authenticator App) ─────────────────────────────────────────────────

export function generateTOTPSecret(userEmail: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    otpAuthUrl: totp.toString(),
  };
}

export async function generateTOTPQRCode(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl);
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token: code.replace(/\s/g, ""), window: OTP_WINDOW });
  return delta !== null;
}

// ─── Email OTP ────────────────────────────────────────────────────────────────

function generateEmailCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendEmailOTP(userId: string, email: string): Promise<void> {
  const code = generateEmailCode();
  const expiry = new Date(Date.now() + EMAIL_CODE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEmailCode: code,
      twoFactorEmailCodeExpiry: expiry,
    },
  });

  const transport = getMailTransport();

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? `"${APP_NAME}" <noreply@starcitizenops.com>`,
    to: email,
    subject: `${APP_NAME} – Your login verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#f97316">StarCitizenOps – Verification Code</h2>
        <p>Use this code to complete your login. It expires in ${EMAIL_CODE_EXPIRY_MINUTES} minutes.</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.25em;color:#0f172a;background:#f1f5f9;padding:1rem 2rem;border-radius:8px;text-align:center;margin:1.5rem 0">
          ${code}
        </div>
        <p style="color:#64748b;font-size:0.875rem">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
    text: `Your StarCitizenOps verification code is: ${code}\n\nExpires in ${EMAIL_CODE_EXPIRY_MINUTES} minutes.`,
  });
}

export async function verifyEmailOTP(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEmailCode: true, twoFactorEmailCodeExpiry: true },
  });

  if (!user?.twoFactorEmailCode || !user.twoFactorEmailCodeExpiry) return false;
  if (new Date() > user.twoFactorEmailCodeExpiry) return false;
  if (user.twoFactorEmailCode !== code.trim()) return false;

  // Clear code after successful use
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEmailCode: null, twoFactorEmailCodeExpiry: null },
  });

  return true;
}

// ─── Generic verify dispatcher ───────────────────────────────────────────────

export async function verifyTwoFactorCode(
  userId: string,
  code: string,
  method: string,
  secret?: string | null,
): Promise<boolean> {
  if (method === "TOTP") {
    if (!secret) return false;
    return verifyTOTPCode(secret, code);
  }

  if (method === "EMAIL") {
    return verifyEmailOTP(userId, code);
  }

  return false;
}
