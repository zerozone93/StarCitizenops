"use client"
import { useState } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  body?: string | null
  read: boolean
  link?: string | null
  createdAt: Date
}

interface NotificationListProps {
  notifications: Notification[]
}

export function NotificationList({ notifications: initial }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initial)

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" })
    if (res.ok) {
      setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n))
    }
  }

  const unread = notifications.filter((n) => !n.read).length

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No notifications</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {unread > 0 && (
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            {unread} unread
          </Badge>
        </div>
      )}
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border transition-colors",
            notification.read
              ? "border-border bg-slate-900/50"
              : "border-cyan-500/20 bg-cyan-500/5"
          )}
        >
          <div className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0", notification.read ? "bg-muted" : "bg-cyan-400")} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{notification.title}</p>
            {notification.body && <p className="text-xs text-muted-foreground mt-0.5">{notification.body}</p>}
            <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
          </div>
          {!notification.read && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => markRead(notification.id)}>
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
