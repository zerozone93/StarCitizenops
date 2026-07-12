import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/loading-state";

export default function InventoryIndustrialLoading() {
  return (
    <AppShell title="Inventory & Industrial" subtitle="Integrated logistics, inventory, and industrial workflow tool">
      <LoadingState label="Loading Inventory & Industrial..." />
    </AppShell>
  );
}