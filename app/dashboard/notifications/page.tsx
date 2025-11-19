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
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  FileText,
  User2,
  PieChart,
  Target,
} from "lucide-react";

import Link from "next/link";
import { useNotifications } from "@/contexts/notification-context";
import {
  NotificationPriority,
  NotificationType,
  User,
  UserPermission,
  UserRole,
} from "@prisma/client";
import { NotificationsSkeleton } from "./_components/FullPageSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "ALERT":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "REMINDER":
      return <Clock className="h-4 w-4 text-yellow-500" />;

    case "PAYMENT":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "INVOICE":
      return <FileText className="h-4 w-4 text-orange-500" />;
    case "CLIENT":
      return <User2 className="h-4 w-4 text-cyan-500" />;
    case "BUDGET":
      return <PieChart className="h-4 w-4 text-indigo-500" />;
    case "TARGET":
      return <Target className="h-4 w-4 text-pink-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: NotificationPriority) => {
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

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function NotificationsPage() {
  const { userId } = useAuth();

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

  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isMutating, setIsMutating] = useState(false);

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

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = data?.role
    ? hasRole(data?.role, fullAccessRoles)
    : false;

  const canViewNotifications = data?.permissions?.includes(
    UserPermission.SYSTEMS_NOTIFICATIONS
  );

  useEffect(() => {
    if (
      hasFullAccess === false &&
      canViewNotifications === false &&
      !isLoading
    ) {
      router.push("/dashboard");
    }
  }, [hasFullAccess, canViewNotifications, isLoading]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      setIsMutating(true);
      await markAsRead(id);

      refreshNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setIsMutating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMutating(true);
      await markAllAsRead();
      // The context should handle updating the state automatically
      // If it doesn't, you might need to call refreshNotifications() instead
      refreshNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsMutating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto">
        <NotificationsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            System Activities
          </h2>
          <p className="text-muted-foreground">
            Stay updated with your activities and important alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
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
                <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
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
                            <Badge variant="outline" className="text-xs">
                              {notification.type.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {notification.actionUrl && (
                          <Button
                            onClick={() =>
                              handleMarkAsRead(
                                notification.id,
                                notification.isRead
                              )
                            }
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={notification.actionUrl}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        )}
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
