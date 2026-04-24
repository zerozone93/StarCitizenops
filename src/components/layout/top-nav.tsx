"use client"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Bell, LogOut, User, Settings, ChevronDown, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopNavProps {
  user?: { name?: string | null; email?: string | null; image?: string | null }
}

export function TopNav({ user }: TopNavProps) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <header className="h-14 border-b border-border bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2 md:hidden">
        <Shield className="h-5 w-5 text-cyan-400" />
        <span className="font-bold text-sm tracking-widest text-cyan-400">SCOps</span>
      </div>

      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground font-mono">
        <span className="text-green-400">●</span>
        <span>SYSTEMS NOMINAL</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:block">{user?.name ?? user?.email}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/edit" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
