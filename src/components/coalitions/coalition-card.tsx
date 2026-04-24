import Link from "next/link"
import { Users, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/utils"

interface CoalitionCardProps {
  coalition: {
    id: string
    name: string
    description?: string | null
    createdAt: Date
    createdBy: { name?: string | null }
    _count?: { members: number }
  }
}

export function CoalitionCard({ coalition }: CoalitionCardProps) {
  return (
    <Link href={`/coalitions/${coalition.id}`}>
      <Card className="cyber-border bg-slate-900 hover:border-cyan-500/40 transition-all group cursor-pointer h-full">
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">{coalition.name}</h3>
          <p className="text-xs text-muted-foreground">by {coalition.createdBy.name ?? "Unknown"}</p>
        </CardHeader>
        <CardContent>
          {coalition.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{coalition.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {coalition._count && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {coalition._count.members} orgs
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatRelativeTime(coalition.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
