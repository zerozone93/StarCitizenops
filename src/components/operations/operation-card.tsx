import Link from "next/link"
import { Calendar, MapPin, Users, Shield } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ThreatLevelBadge } from "@/components/ui/threat-level-badge"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface OperationCardProps {
  operation: {
    id: string
    title: string
    type: string
    status: string
    threatLevel: string
    location?: string | null
    startTime?: Date | null
    description?: string | null
    organization: { name: string; tag: string }
    commander: { name?: string | null }
    _count?: { participants: number }
  }
}

export function OperationCard({ operation }: OperationCardProps) {
  return (
    <Link href={`/operations/${operation.id}`}>
      <Card className="cyber-border bg-slate-900 hover:border-cyan-500/40 transition-all group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors truncate">
                {operation.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{operation.organization.name}</p>
            </div>
            <StatusBadge status={operation.status as "PLANNING" | "BRIEFING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DEBRIEF"} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {operation.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{operation.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <ThreatLevelBadge level={operation.threatLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"} />
            <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700 text-slate-400">
              {operation.type.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
            {operation.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {operation.location}
              </span>
            )}
            {operation.startTime && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(operation.startTime)}
              </span>
            )}
            {operation._count && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {operation._count.participants}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> {operation.commander.name ?? "Unknown"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
