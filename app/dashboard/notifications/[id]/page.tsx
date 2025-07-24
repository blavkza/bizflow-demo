"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  ExternalLink,
  BookMarkedIcon as MarkAsUnread,
  Trash2,
  Share,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Mock notification data - in real app, this would come from API
const getNotificationById = (id: string) => {
  const notifications = {
    "1": {
      id: "1",
      type: "alert",
      priority: "high",
      title: "Payment Overdue",
      message: "Invoice #INV-2024-001 from ABC Corp is 15 days overdue (R15,750.00)",
      fullDescription:
        "The invoice INV-2024-001 issued to ABC Corp on December 1st, 2023 for R15,750.00 is now 15 days overdue. This invoice was for consulting services provided in November 2023. The client has been sent 2 reminder emails but has not responded. Immediate action is required to follow up on this payment.",
      timestamp: "2024-01-15T10:30:00Z",
      read: false,
      category: "payment",
      actionUrl: "/invoices/1",
      relatedData: {
        invoiceNumber: "INV-2024-001",
        clientName: "ABC Corp",
        amount: "R15,750.00",
        dueDate: "2023-12-31",
        daysOverdue: 15,
        remindersSent: 2,
      },
      actions: [
        { label: "View Invoice", url: "/invoices/1", primary: true },
        { label: "Send Reminder", url: "/invoices/1/remind" },
        { label: "Contact Client", url: "/clients/abc-corp" },
      ],
    },
    "2": {
      id: "2",
      type: "reminder",
      priority: "medium",
      title: "Budget Limit Warning",
      message: "Marketing budget has reached 85% of monthly limit (R8,500 / R10,000)",
      fullDescription:
        "Your Marketing budget category has reached 85% of its monthly allocation. You have spent R8,500 out of your R10,000 monthly budget, leaving only R1,500 remaining for the rest of January. Consider reviewing your spending or adjusting the budget if needed.",
      timestamp: "2024-01-15T09:15:00Z",
      read: false,
      category: "budget",
      actionUrl: "/budget",
      relatedData: {
        budgetCategory: "Marketing",
        spent: "R8,500",
        total: "R10,000",
        remaining: "R1,500",
        percentage: "85%",
        daysRemaining: 16,
      },
      actions: [
        { label: "View Budget", url: "/budget", primary: true },
        { label: "Adjust Budget", url: "/budget/edit" },
        { label: "View Expenses", url: "/transactions?category=marketing" },
      ],
    },
  }

  return notifications[id as keyof typeof notifications] || null
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "alert":
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    case "reminder":
      return <Clock className="h-5 w-5 text-yellow-500" />
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    default:
      return <Info className="h-5 w-5" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "destructive"
    case "medium":
      return "default"
    case "low":
      return "secondary"
    default:
      return "default"
  }
}

export default function NotificationDetailPage() {
  const params = useParams()
  const notification = getNotificationById(params.id as string)
  const [isRead, setIsRead] = useState(notification?.read || false)

  if (!notification) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/notifications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notifications
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Notification not found</h3>
            <p className="text-muted-foreground">The notification you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/notifications">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notifications
          </Link>
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsRead(!isRead)}>
            <MarkAsUnread className="h-4 w-4 mr-2" />
            {isRead ? "Mark as unread" : "Mark as read"}
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3">
              {getNotificationIcon(notification.type)}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-xl">{notification.title}</CardTitle>
                  <Badge variant={getPriorityColor(notification.priority)}>{notification.priority} priority</Badge>
                  {!isRead && <Badge variant="secondary">Unread</Badge>}
                </div>
                <CardDescription className="text-base">{notification.message}</CardDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>
              {new Date(notification.timestamp).toLocaleDateString()} at{" "}
              {new Date(notification.timestamp).toLocaleTimeString()}
            </span>
            <Badge variant="outline">{notification.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Details</h3>
            <p className="text-muted-foreground leading-relaxed">{notification.fullDescription}</p>
          </div>

          {notification.relatedData && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Related Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(notification.relatedData).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Available Actions</h3>
            <div className="flex flex-wrap gap-3">
              {notification.actions.map((action, index) => (
                <Button key={index} variant={action.primary ? "default" : "outline"} asChild>
                  <Link href={action.url}>
                    {action.label}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
