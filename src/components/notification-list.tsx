import { NotificationType } from "@prisma/client";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
};

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`rounded-lg border p-3 ${notification.read ? "border-slate-700 bg-slate-900/40" : "border-cyan-500/40 bg-cyan-500/10"}`}
        >
          <p className="text-xs uppercase tracking-wider text-slate-400">{notification.type}</p>
          <h3 className="text-sm font-semibold text-cyan-100">{notification.title}</h3>
          <p className="text-sm text-slate-300">{notification.body || "No details"}</p>
        </article>
      ))}
      {!notifications.length ? <p className="text-sm text-slate-400">No notifications yet.</p> : null}
    </div>
  );
}
