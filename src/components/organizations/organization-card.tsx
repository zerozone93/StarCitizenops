import Link from "next/link"
import { Users, Tag } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface OrganizationCardProps {
  org: {
    id: string
    name: string
    tag: string
    focusType: string
    visibility: string
    description?: string | null
    _count?: { members: number }
  }
}

const focusColors: Record<string, string> = {
  MILITARY: "bg-red-500/20 text-red-400 border-red-500/30",
  LOGISTICS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  MINING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  SALVAGE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  SECURITY: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  EXPLORATION: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  TRADE: "bg-green-500/20 text-green-400 border-green-500/30",
  MIXED: "bg-slate-500/20 text-slate-400 border-slate-500/30",
}

export function OrganizationCard({ org }: OrganizationCardProps) {
  return (
    <Link href={`/organizations/${org.id}`}>
      <Card className="cyber-border bg-slate-900 hover:border-cyan-500/40 transition-all group cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">{org.name}</h3>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                <span className="font-mono">[{org.tag}]</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${focusColors[org.focusType] ?? focusColors.MIXED}`}
            >
              {org.focusType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {org.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{org.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {org._count && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {org._count.members} members
              </span>
            )}
            <Badge
              variant="outline"
              className={
                org.visibility === "PUBLIC"
                  ? "text-[10px] bg-green-500/10 text-green-400 border-green-500/20"
                  : "text-[10px] bg-red-500/10 text-red-400 border-red-500/20"
              }
            >
              {org.visibility}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
