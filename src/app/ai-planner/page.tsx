import { AIPlannerPanel } from "@/components/ai-planner-panel";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";

export default async function AIPlannerPage() {
  await requireUser();

  return (
    <AppShell title="AI Planner" subtitle="Generate structured operation briefs">
      <AIPlannerPanel />
    </AppShell>
  );
}
