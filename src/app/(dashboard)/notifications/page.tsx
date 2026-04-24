import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { NotificationList } from "@/components/notifications/notification-list"
import { Bell } from "lucide-react"

export default async function NotificationsPage() {
  const session = await requireAuth()

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-cyan-400" /> Notifications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{notifications.filter(n => !n.read).length} unread</p>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  )
}
