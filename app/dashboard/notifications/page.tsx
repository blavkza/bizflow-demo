"use client";

import { useState } from "react";
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
  BookMarkedIcon as MarkAsUnread,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

const notifications = [
  {
    id: "1",
    type: "alert",
    priority: "high",
    title: "Payment Overdue",
    message:
      "Invoice #INV-2024-001 from ABC Corp is 15 days overdue (R15,750.00)",
    timestamp: "2024-01-15T10:30:00Z",
    read: false,
    category: "payment",
    actionUrl: "/invoices/1",
  },
  {
    id: "2",
    type: "reminder",
    priority: "medium",
    title: "Budget Limit Warning",
    message:
      "Marketing budget has reached 85% of monthly limit (R8,500 / R10,000)",
    timestamp: "2024-01-15T09:15:00Z",
    read: false,
    category: "budget",
    actionUrl: "/budget",
  },
  {
    id: "3",
    type: "info",
    priority: "low",
    title: "Monthly Report Ready",
    message:
      "Your December 2023 financial report has been generated and is ready for review",
    timestamp: "2024-01-15T08:00:00Z",
    read: true,
    category: "report",
    actionUrl: "/reports/summary",
  },
  {
    id: "4",
    type: "alert",
    priority: "high",
    title: "Payroll Due",
    message: "Employee payroll processing is due in 2 days (January 17, 2024)",
    timestamp: "2024-01-14T16:45:00Z",
    read: false,
    category: "payroll",
    actionUrl: "/workers",
  },
  {
    id: "5",
    type: "success",
    priority: "low",
    title: "Payment Received",
    message:
      "Payment of R25,000.00 received from XYZ Ltd for Invoice #INV-2024-003",
    timestamp: "2024-01-14T14:20:00Z",
    read: true,
    category: "payment",
    actionUrl: "/transactions",
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "alert":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "reminder":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "unread") return matchesSearch && !notification.read;
    if (selectedTab === "alerts")
      return matchesSearch && notification.type === "alert";
    if (selectedTab === "reminders")
      return matchesSearch && notification.type === "reminder";

    return matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
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
                    !notification.read ? "border-l-4 border-l-blue-500" : ""
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
                                !notification.read ? "font-semibold" : ""
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <Badge
                              variant={getPriorityColor(notification.priority)}
                              className="text-xs"
                            >
                              {notification.priority}
                            </Badge>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(
                                notification.timestamp
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                notification.timestamp
                              ).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/dashboard/notifications/${notification.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <MarkAsUnread className="h-4 w-4 mr-2" />
                              {notification.read
                                ? "Mark as unread"
                                : "Mark as read"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={notification.actionUrl}>
                                <Eye className="h-4 w-4 mr-2" />
                                Go to source
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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
