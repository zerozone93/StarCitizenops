import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

const threatConfig: Record<ThreatLevel, { label: string; className: string }> = {
  LOW: { label: "LOW", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  MEDIUM: { label: "MEDIUM", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  HIGH: { label: "HIGH", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  CRITICAL: { label: "CRITICAL", className: "bg-red-500/20 text-red-400 border-red-500/30" },
}

export function ThreatLevelBadge({ level }: { level: ThreatLevel }) {
  const config = threatConfig[level] || threatConfig.MEDIUM
  return (
    <Badge variant="outline" className={cn("text-xs font-mono", config.className)}>
      ⚠ {config.label}
    </Badge>
  )
}
