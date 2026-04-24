import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"
import { auth } from "@/auth"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopNav user={session?.user} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
