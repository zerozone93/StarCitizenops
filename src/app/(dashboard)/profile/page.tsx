import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { getFullUser } from "@/lib/auth-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Edit, Ship, Building2 } from "lucide-react"

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = await getFullUser(session.user.id)

  if (!user) return <div>User not found</div>

  const initials = (user.name ?? user.email ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button variant="outline" asChild>
          <Link href="/profile/edit"><Edit className="h-4 w-4 mr-2" />Edit Profile</Link>
        </Button>
      </div>

      <Card className="cyber-border bg-slate-900">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.name ?? "Unknown Pilot"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.starCitizenHandle && (
                <p className="text-sm text-cyan-400 mt-1 font-mono">@{user.starCitizenHandle}</p>
              )}
              {user.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {user.preferredRoles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs bg-slate-800">{role}</Badge>
                ))}
              </div>
            </div>
          </div>
          {(user.timezone || user.availability) && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
              {user.timezone && <div><p className="text-xs text-muted-foreground">Timezone</p><p>{user.timezone}</p></div>}
              {user.availability && <div><p className="text-xs text-muted-foreground">Availability</p><p>{user.availability}</p></div>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="cyber-border bg-slate-900">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-cyan-400" />Organizations</CardTitle></CardHeader>
          <CardContent>
            {user.organizationMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No organizations</p>
            ) : (
              <div className="space-y-2">
                {user.organizationMemberships.map((m) => (
                  <Link key={m.id} href={`/organizations/${m.organization.id}`} className="flex items-center gap-2 p-2 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors">
                    <span className="font-mono text-xs text-cyan-400">[{m.organization.tag}]</span>
                    <span className="text-sm">{m.organization.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="cyber-border bg-slate-900">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Ship className="h-4 w-4 text-cyan-400" />Fleet</CardTitle></CardHeader>
          <CardContent>
            {user.ships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ships registered</p>
            ) : (
              <div className="space-y-2">
                {user.ships.map((ship) => (
                  <div key={ship.id} className="flex items-center justify-between p-2 rounded-md bg-slate-800">
                    <span className="text-sm">{ship.name}</span>
                    <span className="text-xs text-muted-foreground">x{ship.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
