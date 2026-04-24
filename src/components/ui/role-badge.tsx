import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type OrgRole = "OWNER" | "OFFICER" | "MEMBER" | "GUEST"

const roleConfig: Record<OrgRole, { label: string; className: string }> = {
  OWNER: { label: "Owner", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  OFFICER: { label: "Officer", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  MEMBER: { label: "Member", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  GUEST: { label: "Guest", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
}

export function RoleBadge({ role }: { role: OrgRole }) {
  const config = roleConfig[role] || roleConfig.MEMBER
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {config.label}
    </Badge>
  )
}
