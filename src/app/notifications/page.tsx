import { AppShell } from "@/components/app-shell";
import { NotificationList } from "@/components/notification-list";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <AppShell title="Notifications" subtitle="Unread and read updates">
      <div className="grid gap-4">
        <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-lg font-semibold text-cyan-100">Unread</h3>
          <NotificationList notifications={notifications.filter((n) => !n.read)} />
        </section>
        <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-lg font-semibold text-cyan-100">Read</h3>
          <NotificationList notifications={notifications.filter((n) => n.read)} />
        </section>
      </div>
    </AppShell>
  );
}
