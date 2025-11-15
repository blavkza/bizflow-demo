import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Receipt,
  Users,
  Briefcase,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Alert {
  id: string;
  type: "invoice" | "expense" | "quotation" | "project" | "payroll" | "task";
  title: string;
  description: string;
  dueDate?: string;
  daysRemaining: number;
  priority?: "low" | "medium" | "high" | "critical";
}

interface AlertSectionProps {
  isLoading: boolean;
  data: {
    alerts?: Alert[] | any; // Allow any type for debugging
  };
}

// Helper function to safely get alerts array
function getSafeAlerts(alerts: any): Alert[] {
  if (!alerts) return [];
  if (Array.isArray(alerts)) return alerts;

  // If it's not an array but exists, log for debugging
  console.warn("Alerts is not an array:", alerts);
  return [];
}

export default function AlertSection({ isLoading, data }: AlertSectionProps) {
  // Safely get alerts with proper type checking
  const alerts: Alert[] = getSafeAlerts(data?.alerts);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Today's Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show alert section if there are no alerts
  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <FileText className="h-4 w-4" />;
      case "expense":
        return <Receipt className="h-4 w-4" />;
      case "quotation":
        return <FileText className="h-4 w-4" />;
      case "project":
        return <Briefcase className="h-4 w-4" />;
      case "payroll":
        return <Users className="h-4 w-4" />;
      case "task":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "invoice":
        return "bg-blue-100 text-blue-800";
      case "expense":
        return "bg-orange-100 text-orange-800";
      case "quotation":
        return "bg-purple-100 text-purple-800";
      case "project":
        return "bg-green-100 text-green-800";
      case "payroll":
        return "bg-red-100 text-red-800";
      case "task":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadge = (daysRemaining: number, priority?: string) => {
    if (priority) {
      const priorityColors = {
        critical: "bg-red-100 text-red-800 border-red-200",
        high: "bg-orange-100 text-orange-800 border-orange-200",
        medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
        low: "bg-green-100 text-green-800 border-green-200",
      };
      return (
        <Badge
          variant="outline"
          className={
            priorityColors[priority as keyof typeof priorityColors] ||
            "bg-gray-100 text-gray-800"
          }
        >
          {priority}
        </Badge>
      );
    }

    // Fallback to days-based priority
    if (daysRemaining <= 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysRemaining <= 1) {
      return <Badge variant="default">Due today</Badge>;
    } else if (daysRemaining <= 3) {
      return <Badge variant="default">{daysRemaining} days</Badge>;
    } else {
      return <Badge variant="secondary">{daysRemaining} days</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Today's Alerts
          <Badge variant="secondary" className="ml-2">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-full ${getAlertColor(alert.type)}`}
                >
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                  {alert.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {format(new Date(alert.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(alert.daysRemaining, alert.priority)}
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
