import { useNotifications } from "@/contexts/notification-context";
import { useState } from "react";

const {
  notifications,
  unreadCount,
  loading,
  error,
  markAsRead,
  markAllAsRead,
  refreshNotifications,
  setNotifications,
} = useNotifications();

const [isMutating, setIsMutating] = useState(false);

export const handleMarkAsRead = async (id: string, isRead: boolean) => {
  try {
    setIsMutating(true);
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !isRead } : n))
    );
  } catch (error) {
    console.error("Failed to mark as read:", error);
  } finally {
    setIsMutating(false);
  }
};

export const handleMarkAllAsRead = async () => {
  try {
    setIsMutating(true);
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  } catch (error) {
    console.error("Failed to mark all as read:", error);
  } finally {
    setIsMutating(false);
  }
};
