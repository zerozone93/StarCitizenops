import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { NotificationType } from "@prisma/client";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type as NotificationType,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    },
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError("Notification not found");
  if (notification.userId !== userId) throw new NotFoundError("Notification not found");
  return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
