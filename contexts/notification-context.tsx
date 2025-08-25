"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/actions";
import { NotificationPriority, NotificationType } from "@prisma/client";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string | null;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const refreshNotifications = async (
    isBackgroundRefresh = false
  ): Promise<void> => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);
      const data = await getNotifications();
      setNotifications(data);

      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setError("Failed to fetch notifications. Please try again later.");
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshNotifications();

    const interval = setInterval(() => {
      refreshNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string): Promise<void> => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      setError("Failed to mark notification as read. Please try again.");
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      setError("Failed to mark all notifications as read. Please try again.");
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refreshNotifications: () => refreshNotifications(false),
        setNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
