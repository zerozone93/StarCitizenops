import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RoleBadge } from "@/components/ui/role-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tag, Users, Crosshair } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { OperationCard } from "@/components/operations/operation-card"

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      operations: {
        include: {
          organization: true,
          commander: { select: { name: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      _count: { select: { members: true, operations: true } },
    },
  })

  if (!org) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="cyber-border rounded-lg bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span className="font-mono">[{org.tag}]</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700">{org.focusType}</Badge>
            <Badge variant="outline" className={`text-xs ${org.visibility === "PUBLIC" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {org.visibility}
            </Badge>
          </div>
        </div>
        {org.description && <p className="text-sm text-muted-foreground mt-4">{org.description}</p>}
        <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{org._count.members} members</span>
          <span className="flex items-center gap-1"><Crosshair className="h-3 w-3" />{org._count.operations} operations</span>
          <span>Founded {formatDate(org.createdAt)}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground font-mono bg-slate-800 rounded p-2 inline-block">
          ID: {org.id}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="cyber-border bg-slate-900">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-cyan-400" />Roster</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {org.members.map((member) => {
                const initials = (member.user.name ?? member.user.email ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                return (
                  <div key={member.id} className="flex items-center gap-2 p-2 rounded-md bg-slate-800">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{member.user.name ?? member.user.email}</p>
                      {member.title && <p className="text-[10px] text-muted-foreground">{member.title}</p>}
                    </div>
                    <RoleBadge role={member.role as "OWNER"|"OFFICER"|"MEMBER"|"GUEST"} />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Crosshair className="h-4 w-4 text-cyan-400" />Recent Operations
          </h2>
          {org.operations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No operations yet</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {org.operations.map((op) => <OperationCard key={op.id} operation={op} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
