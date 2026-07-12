import { AppShell } from "@/components/app-shell";
import { InventoryIndustrialConsole } from "@/components/inventory-industrial-console";
import { requireUser } from "@/lib/session";

export default async function InventoryIndustrialPage() {
  await requireUser();

  return (
    <AppShell title="Inventory & Industrial" subtitle="Integrated logistics, inventory, and industrial workflow tool">
      <InventoryIndustrialConsole />
    </AppShell>
  );
}