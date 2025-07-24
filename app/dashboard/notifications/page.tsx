"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Bookmark as MarkAsUnread,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  isRead: boolean;
  actionUrl?: string;
  metadata?: any;
  channels: string[];
  sentAt: string;
  readAt?: string | null;
  createdAt: string;
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "ALERT":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "REMINDER":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "INFO":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "SUCCESS":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: "LOW" | "MEDIUM" | "HIGH") => {
  switch (priority) {
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "default";
    case "LOW":
      return "secondary";
    default:
      return "default";
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/notifications");
        if (!response.ok) throw new Error("Failed to fetch notifications");
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  console.log(notifications);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "unread") return matchesSearch && !notification.isRead;
    if (selectedTab === "alerts")
      return matchesSearch && notification.type === "ALERT";
    if (selectedTab === "reminders")
      return matchesSearch && notification.type === "REMINDER";

    return matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notificationId: string, currentState: boolean) => {
    try {
      setIsMutating(true);
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: !currentState }),
      });

      if (!response.ok) throw new Error("Failed to update notification");

      setNotifications(
        notifications.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                isRead: !currentState,
                readAt: currentState ? null : new Date().toISOString(),
              }
            : n
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setIsMutating(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setIsMutating(true);
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setIsMutating(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMutating(true);
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications(
        notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with your financial activities and important alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || isMutating}
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              "Mark all as read"
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No notifications found
                </h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "You're all caught up!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? "border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4
                              className={`text-sm font-medium ${
                                !notification.isRead ? "font-semibold" : ""
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <Badge
                              variant={getPriorityColor(notification.priority)}
                              className="text-xs"
                            >
                              {notification.priority.toLowerCase()}
                            </Badge>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(
                                notification.createdAt
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                notification.createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {notification.type && (
                              <Badge variant="outline" className="text-xs">
                                {notification.type.toLowerCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {notification.actionUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={notification.actionUrl}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isMutating}
                            >
                              {isMutating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                markAsRead(notification.id, notification.isRead)
                              }
                              disabled={isMutating}
                            >
                              <MarkAsUnread className="h-4 w-4 mr-2" />
                              {notification.isRead
                                ? "Mark as unread"
                                : "Mark as read"}
                            </DropdownMenuItem>
                            {notification.actionUrl && (
                              <DropdownMenuItem asChild>
                                <Link href={notification.actionUrl}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Go to source
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              disabled={isMutating}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
