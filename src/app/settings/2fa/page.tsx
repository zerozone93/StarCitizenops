import { AppShell } from "@/components/app-shell";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";

export const dynamic = "force-dynamic";

export default function TwoFactorSettingsPage() {
  return (
    <AppShell title="Two-Factor Authentication" subtitle="Security settings">
      <div className="flex justify-center py-8">
        <TwoFactorSetup />
      </div>
    </AppShell>
  );
}
