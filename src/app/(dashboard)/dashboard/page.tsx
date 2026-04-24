import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { OperationCard } from "@/components/operations/operation-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Crosshair, Building2, Users, Plus, Activity, Bell } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await requireAuth()
  const userId = session.user.id

  const [upcomingOps, userOrgs, recentActivity, unreadCount] = await Promise.all([
    prisma.operation.findMany({
      where: {
        status: { in: ["PLANNING", "BRIEFING", "ACTIVE"] },
        OR: [
          { commanderId: userId },
          { participants: { some: { userId } } },
          { organization: { members: { some: { userId } } } },
        ],
      },
      include: {
        organization: true,
        commander: { select: { name: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startTime: "asc" },
      take: 6,
    }),
    prisma.organizationMember.count({ where: { userId } }),
    prisma.activityFeedItem.findMany({
      where: {
        OR: [
          { userId },
          { organization: { members: { some: { userId } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  const stats = [
    { label: "Active Operations", value: upcomingOps.filter(o => o.status === "ACTIVE").length, icon: Crosshair, color: "text-green-400" },
    { label: "Organizations", value: userOrgs, icon: Building2, color: "text-blue-400" },
    { label: "Unread Alerts", value: unreadCount, icon: Bell, color: "text-yellow-400" },
    { label: "Total Operations", value: upcomingOps.length, icon: Activity, color: "text-cyan-400" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back, {session.user.name ?? session.user.email}</p>
        </div>
        <Button className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
          <Link href="/operations/new"><Plus className="h-4 w-4 mr-2" />New Operation</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="cyber-border bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-cyan-400" /> Upcoming Operations
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/operations">View All</Link>
            </Button>
          </div>
          {upcomingOps.length === 0 ? (
            <EmptyState
              icon={Crosshair}
              title="No active operations"
              description="Create an operation to get started"
              action={
                <Button size="sm" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
                  <Link href="/operations/new"><Plus className="h-4 w-4 mr-1" />New Operation</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {upcomingOps.map((op) => <OperationCard key={op.id} operation={op} />)}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" /> Activity Feed
          </h2>
          <Card className="cyber-border bg-slate-900">
            <CardContent className="p-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex gap-2 text-xs">
                      <span className="text-cyan-400 shrink-0 mt-0.5">▸</span>
                      <div>
                        <p className="text-foreground">{item.title}</p>
                        {item.body && <p className="text-muted-foreground">{item.body}</p>}
                        <p className="text-muted-foreground/60">{formatRelativeTime(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-border" asChild>
              <Link href="/organizations/new"><Building2 className="h-4 w-4 mr-2" />New Org</Link>
            </Button>
            <Button variant="outline" className="border-border" asChild>
              <Link href="/ai-planner"><Users className="h-4 w-4 mr-2" />AI Plan</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
