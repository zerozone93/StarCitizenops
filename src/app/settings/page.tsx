import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DiscordUserLink } from "@/components/discord-user-link";
import { SettingsForms } from "@/components/settings/settings-forms";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const [profile, ownedOrganizations, userSecurity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        starCitizenHandle: true,
        bio: true,
        timezone: true,
        availability: true,
        preferredRoles: true,
        discordUserId: true,
        discordUsername: true,
      },
    }),
    prisma.organization.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        tag: true,
        focusType: true,
        visibility: true,
        description: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true, twoFactorMethod: true },
    }),
  ]);

  if (!profile) return null;

  return (
    <AppShell title="Settings" subtitle="Profile, security, and organization preferences">
      {/* Security section */}
      {TWO_FACTOR_ENABLED ? (
        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Security</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-200">Two-Factor Authentication</p>
              <p className="text-sm text-slate-400">
                {userSecurity?.twoFactorEnabled
                  ? `Enabled · ${userSecurity.twoFactorMethod === "TOTP" ? "Authenticator App" : "Email OTP"}`
                  : "Not enabled – add extra login security"}
              </p>
            </div>
            <Link
              href="/settings/2fa"
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                userSecurity?.twoFactorEnabled
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                  : "border-orange-300/40 bg-orange-400/15 text-orange-100 hover:bg-orange-300/25"
              }`}
            >
              {userSecurity?.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
            </Link>
          </div>
        </section>
      ) : null}

      <SettingsForms profile={profile} ownedOrganizations={ownedOrganizations} />

      <DiscordUserLink
        discordUserId={profile.discordUserId ?? null}
        discordUsername={profile.discordUsername ?? null}
      />
    </AppShell>
  );
}
