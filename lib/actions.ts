"use server";

import type { Notification } from "@/contexts/notification-context";
import db from "./db";

export async function getNotifications(): Promise<Notification[]> {
  const notifications = await db.notification.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications.map((notification) => ({
    ...notification,
    link:
      notification.actionUrl === undefined ? undefined : notification.actionUrl,
  }));
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await db.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await db.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await db.notification.delete({
    where: { id },
  });
}
