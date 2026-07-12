import { Badge } from "@/components/ui/badge";

export function ThreatLevelBadge({ level }: { level: string }) {
  const tone =
    level === "CRITICAL"
      ? "border-red-300/45 bg-red-300/12 text-red-100"
      : level === "HIGH"
        ? "border-orange-300/45 bg-orange-300/12 text-orange-100"
        : level === "MODERATE"
          ? "border-amber-300/45 bg-amber-300/12 text-amber-100"
          : "border-emerald-300/45 bg-emerald-300/12 text-emerald-100";

  return (
    <Badge className={`${tone} rounded-md border text-[11px] font-semibold uppercase tracking-wide`}>
      Threat: {level}
    </Badge>
  );
}
