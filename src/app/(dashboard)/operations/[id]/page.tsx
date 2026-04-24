import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ThreatLevelBadge } from "@/components/ui/threat-level-badge"
import { CommentThread } from "@/components/comments/comment-thread"
import { RSVPPanel } from "@/components/operations/rsvp-panel"
import { AssetList } from "@/components/assets/asset-list"
import { formatDate } from "@/lib/utils"
import { MapPin, Calendar, Shield, Building2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default async function OperationDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth()

  const operation = await prisma.operation.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      commander: { select: { id: true, name: true, email: true } },
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      assets: true,
      comments: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      rsvps: { where: { userId: session.user.id } },
      _count: { select: { participants: true, comments: true } },
    },
  })

  if (!operation) notFound()

  const userRsvp = operation.rsvps[0]?.status ?? null

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold">{operation.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{operation.organization.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={operation.status as "PLANNING"|"BRIEFING"|"ACTIVE"|"COMPLETED"|"CANCELLED"|"DEBRIEF"} />
            <ThreatLevelBadge level={operation.threatLevel as "LOW"|"MEDIUM"|"HIGH"|"CRITICAL"} />
            <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700 text-slate-400">
              {operation.type.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {operation.location && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{operation.location}</span>
          )}
          {operation.startTime && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(operation.startTime)}</span>
          )}
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" />Commander: {operation.commander.name}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{operation._count.participants} participants</span>
        </div>
      </div>

      <RSVPPanel operationId={operation.id} currentStatus={userRsvp} />

      <Tabs defaultValue="brief">
        <TabsList className="bg-slate-800 border border-border">
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="participants">Roster</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="comms">Comms</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="space-y-4 mt-4">
          {[
            { label: "Description", value: operation.description },
            { label: "Primary Objective", value: operation.objective },
            { label: "Mission Brief", value: operation.missionBrief },
            { label: "Rules of Engagement", value: operation.rulesOfEngagement },
            { label: "Rally Points", value: operation.rallyPoints },
            { label: "Extraction Plan", value: operation.extractionPlan },
            { label: "Contingency Plans", value: operation.contingencyPlans },
            { label: "Required Supplies", value: operation.requiredSupplies },
          ].filter(s => s.value).map((section) => (
            <Card key={section.label} className="cyber-border bg-slate-900">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-cyan-400">{section.label}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.value}</p></CardContent>
            </Card>
          ))}
          {!operation.description && !operation.objective && (
            <Card className="cyber-border bg-slate-900"><CardContent className="py-8 text-center text-muted-foreground text-sm">No mission brief available yet.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <Card className="cyber-border bg-slate-900">
            <CardHeader><CardTitle className="text-sm">Roster ({operation._count.participants})</CardTitle></CardHeader>
            <CardContent>
              {operation.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No participants yet</p>
              ) : (
                <div className="space-y-2">
                  {operation.participants.map((p) => {
                    const initials = (p.user.name ?? p.user.email ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-md bg-slate-800">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{p.user.name ?? p.user.email}</p>
                          {p.assignedRole && <p className="text-xs text-muted-foreground">{p.assignedRole}</p>}
                        </div>
                        <Badge variant="outline" className="text-xs">{p.status}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <Card className="cyber-border bg-slate-900">
            <CardHeader><CardTitle className="text-sm">Deployed Assets</CardTitle></CardHeader>
            <CardContent><AssetList assets={operation.assets} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comms" className="mt-4">
          <Card className="cyber-border bg-slate-900">
            <CardHeader><CardTitle className="text-sm">Operation Comms ({operation._count.comments})</CardTitle></CardHeader>
            <CardContent>
              <CommentThread comments={operation.comments} operationId={operation.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
