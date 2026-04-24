import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { CoalitionCard } from "@/components/coalitions/coalition-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"

export default async function CoalitionsPage() {
  await requireAuth()

  const coalitions = await prisma.coalition.findMany({
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" /> Coalitions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Multi-organization joint operations</p>
        </div>
      </div>

      {coalitions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No coalitions yet"
          description="Coalitions are formed when organizations join together for major operations"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coalitions.map((c) => <CoalitionCard key={c.id} coalition={c} />)}
        </div>
      )}
    </div>
  )
}
