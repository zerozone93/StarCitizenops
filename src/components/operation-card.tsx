import Link from "next/link";
import type { Operation, Organization } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalTime } from "@/components/local-time";
import { StatusBadge } from "@/components/status-badge";
import { ThreatLevelBadge } from "@/components/threat-level-badge";

type OperationCardProps = {
  operation: Operation & { organization?: Pick<Organization, "name" | "tag"> | null };
  viewerTimezone?: string | null;
};

export function OperationCard({ operation, viewerTimezone }: OperationCardProps) {
  return (
    <Card className="rounded-2xl border border-orange-300/20 bg-slate-900/65 transition hover:border-orange-300/40 hover:bg-slate-900/75">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between text-orange-50">
          <Link href={`/operations/${operation.id}`} className="hover:text-orange-200">
            {operation.title}
          </Link>
          <StatusBadge status={operation.status} />
        </CardTitle>
        <p className="text-sm text-slate-300">{operation.organization?.name || "Independent operation"}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>{operation.objective || "No objective defined."}</p>
        {operation.startTime && (
          <p className="text-xs text-slate-400">
            Starts: <LocalTime isoDate={operation.startTime.toISOString()} timezone={viewerTimezone} />
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <ThreatLevelBadge level={operation.threatLevel} />
          <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-medium text-cyan-100">
            {operation.type.replaceAll("_", " ")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
