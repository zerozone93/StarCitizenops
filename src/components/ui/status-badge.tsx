import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type OperationStatus = "PLANNING" | "BRIEFING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DEBRIEF"

const statusConfig: Record<OperationStatus, { label: string; className: string; dot: string }> = {
  PLANNING: { label: "Planning", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  BRIEFING: { label: "Briefing", className: "bg-purple-500/20 text-purple-400 border-purple-500/30", dot: "bg-purple-400" },
  ACTIVE: { label: "Active", className: "bg-green-500/20 text-green-400 border-green-500/30", dot: "bg-green-400 animate-pulse" },
  COMPLETED: { label: "Completed", className: "bg-slate-500/20 text-slate-400 border-slate-500/30", dot: "bg-slate-400" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400" },
  DEBRIEF: { label: "Debrief", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", dot: "bg-cyan-400" },
}

export function StatusBadge({ status }: { status: OperationStatus }) {
  const config = statusConfig[status] || statusConfig.PLANNING
  return (
    <Badge variant="outline" className={cn("gap-1.5 text-xs", config.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </Badge>
  )
}
