import { AddFleetAssetForm } from "@/components/fleet/AddFleetAssetForm";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";

export default async function AddFleetAssetPage() {
  await requireUser();

  return (
    <AppShell title="Add Fleet Asset" subtitle="Add ships and ground vehicles to your inventory">
      <AddFleetAssetForm />
    </AppShell>
  );
}
