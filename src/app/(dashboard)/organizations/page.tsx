import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { OrganizationCard } from "@/components/organizations/organization-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"

export default async function OrganizationsPage() {
  const session = await requireAuth()
  const userId = session.user.id

  const myOrgs = await prisma.organization.findMany({
    where: { members: { some: { userId } } },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  })

  const publicOrgs = await prisma.organization.findMany({
    where: {
      visibility: "PUBLIC",
      members: { none: { userId } },
    },
    include: { _count: { select: { members: true } } },
    take: 20,
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-cyan-400" /> Organizations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your orgs and public organizations</p>
        </div>
        <Button className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
          <Link href="/organizations/new"><Plus className="h-4 w-4 mr-2" />New Org</Link>
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Your Organizations</h2>
        {myOrgs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="You have no organizations"
            description="Create one or join a public organization"
            action={
              <Button className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
                <Link href="/organizations/new"><Plus className="h-4 w-4 mr-2" />Create Organization</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myOrgs.map((org) => <OrganizationCard key={org.id} org={org} />)}
          </div>
        )}
      </section>

      {publicOrgs.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Public Organizations</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicOrgs.map((org) => <OrganizationCard key={org.id} org={org} />)}
          </div>
        </section>
      )}
    </div>
  )
}
