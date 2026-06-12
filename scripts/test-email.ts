import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM ?? "StarCitizenOps <noreply@starcitizenopps.com>";
const to = process.env.TEST_TO ?? "zerozone2@live.com";

if (!host || !user || !pass) {
  console.error("Missing SMTP_HOST, SMTP_USER or SMTP_PASS");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user, pass },
});

const info = await transport.sendMail({
  from,
  to,
  subject: "Welcome to Star Ops",
  text: "Welcome to Star Ops!\n\nYour account is ready and notifications are now active.\n\nFly safe,\nStar Ops Team",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#f97316">Welcome to Star Ops</h2>
      <p>Welcome to Star Ops!</p>
      <p>Your account is ready and notifications are now active.</p>
      <p style="margin-top:24px">Fly safe,<br/>Star Ops Team</p>
    </div>
  `,
});

console.log("SEND_OK", JSON.stringify({
  messageId: info.messageId,
  accepted: info.accepted,
  rejected: info.rejected,
  response: info.response,
}));
