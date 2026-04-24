"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield, Crosshair, Building2, Users, Brain, Bell, User, ChevronRight, Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: Zap, label: "Dashboard" },
  { href: "/operations", icon: Crosshair, label: "Operations" },
  { href: "/organizations", icon: Building2, label: "Organizations" },
  { href: "/coalitions", icon: Users, label: "Coalitions" },
  { href: "/ai-planner", icon: Brain, label: "AI Planner" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-border min-h-screen">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-cyan-400" />
          <div>
            <div className="font-bold text-sm tracking-widest text-cyan-400 glow-cyan">STARCITIZENOPS</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Operations Platform</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-800"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-cyan-400")} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="ml-auto h-3 w-3 text-cyan-400/60" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-[10px] text-muted-foreground text-center tracking-widest">
          ALPHA v0.1.0 • SECURE
        </div>
      </div>
    </aside>
  )
}
