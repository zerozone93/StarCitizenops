import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "ACTIVE"
      ? "border-emerald-300/45 bg-emerald-300/12 text-emerald-100"
      : status === "PLANNED"
        ? "border-cyan-300/45 bg-cyan-300/12 text-cyan-100"
        : status === "COMPLETED"
          ? "border-slate-300/45 bg-slate-300/12 text-slate-100"
          : "border-amber-300/45 bg-amber-300/12 text-amber-100";

  return (
    <Badge className={`${tone} rounded-md border text-[11px] font-semibold uppercase tracking-wide`}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
