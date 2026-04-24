import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { OperationCard } from "@/components/operations/operation-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Crosshair, Plus } from "lucide-react"

export default async function OperationsPage() {
  const session = await requireAuth()
  const userId = session.user.id

  const operations = await prisma.operation.findMany({
    where: {
      OR: [
        { commanderId: userId },
        { participants: { some: { userId } } },
        { organization: { members: { some: { userId } } } },
        { visibility: "PUBLIC" },
      ],
    },
    include: {
      organization: true,
      commander: { select: { name: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crosshair className="h-6 w-6 text-cyan-400" /> Operations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{operations.length} operations found</p>
        </div>
        <Button className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
          <Link href="/operations/new"><Plus className="h-4 w-4 mr-2" />New Operation</Link>
        </Button>
      </div>

      {operations.length === 0 ? (
        <EmptyState
          icon={Crosshair}
          title="No operations yet"
          description="Plan your first operation and coordinate your fleet"
          action={
            <Button className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
              <Link href="/operations/new"><Plus className="h-4 w-4 mr-2" />Create Operation</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operations.map((op) => <OperationCard key={op.id} operation={op} />)}
        </div>
      )}
    </div>
  )
}
