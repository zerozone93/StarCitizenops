import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/loading-state";

export default function ItemFinderLoading() {
  return (
    <AppShell title="Item Finder" subtitle="Mining, crafting, armor, weapons, and utility index">
      <LoadingState label="Loading Item Finder telemetry..." />
    </AppShell>
  );
}