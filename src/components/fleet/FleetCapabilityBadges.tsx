import { Badge } from "@/components/ui/badge";

const capabilityLabels = [
  "Combat",
  "Cargo",
  "Mining",
  "Salvage",
  "Medical",
  "Refuel",
  "Repair",
  "Exploration",
  "Recon",
  "Dropship",
  "Ground Combat",
  "Logistics",
  "Capital",
  "Racing",
  "Support",
] as const;

export function FleetCapabilityBadges({
  capabilityCounts,
}: {
  capabilityCounts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {capabilityLabels.map((label) => {
        const count = capabilityCounts[label] || 0;
        return (
          <Badge
            key={label}
            variant="outline"
            className={
              count > 0
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                : "border-slate-700 text-slate-500"
            }
          >
            {label} {count > 0 ? `x${count}` : ""}
          </Badge>
        );
      })}
    </div>
  );
}
