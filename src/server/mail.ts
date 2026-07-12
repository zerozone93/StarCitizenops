import nodemailer from "nodemailer";

export function getMailTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Dev fallback – emails are logged to console only
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER ?? "test@ethereal.email",
      pass: process.env.ETHEREAL_PASS ?? "testpass",
    },
  });
}

export async function sendWelcomeEmail(email: string, name?: string | null) {
  const recipient = email.trim().toLowerCase();
  const greetingName = name?.trim() || "Pilot";
  const transport = getMailTransport();

  return transport.sendMail({
    from: process.env.SMTP_FROM ?? '"StarCitizenOps" <noreply@starcitizenopps.com>',
    to: recipient,
    subject: "Welcome to StarCitizenOpps",
    text: `Hi ${greetingName},

Welcome to StarCitizenOpps.

I built this platform as a fellow Star Citizen player because we needed better organizational tools and a stronger social space outside the game.

With StarCitizenOpps, you can:
- Organize operations and missions with clearer planning tools
- Coordinate members, roles, and organization activity in one place
- Use social features to stay connected between game sessions
- Stay updated through notifications and team visibility

Thank you for choosing StarCitizenOpps and being part of the community.

Fly safe,
Mike
Creator, StarCitizenOpps`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h2 style="color:#f97316;margin-bottom:12px">Welcome to StarCitizenOpps</h2>
        <p>Hi ${greetingName},</p>
        <p>
          Welcome to <strong>StarCitizenOpps</strong>. I built this platform as a fellow Star Citizen player
          because we needed better organizational tools and a stronger social space outside the game.
        </p>
        <p>With StarCitizenOpps, you can:</p>
        <ul style="padding-left:20px;margin:10px 0">
          <li>Organize operations and missions with clearer planning tools</li>
          <li>Coordinate members, roles, and organization activity in one place</li>
          <li>Use social features to stay connected between game sessions</li>
          <li>Stay updated through notifications and team visibility</li>
        </ul>
        <p>Thank you for choosing StarCitizenOpps and being part of the community.</p>
        <p style="margin-top:18px">Fly safe,<br/>Mike<br/>Creator, StarCitizenOpps</p>
      </div>
    `,
  });
}
