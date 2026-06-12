import { Badge } from "@/components/ui/badge";

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge className="rounded-md border border-cyan-300/45 bg-cyan-300/12 text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
      {role}
    </Badge>
  );
}
