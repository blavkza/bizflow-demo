"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  FileText,
  Receipt,
  Briefcase,
  Users,
  Clock,
  Hammer,
  RefreshCcw,
  Bolt,
  Siren,
  CalendarX,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Alert {
  id: string;
  type:
    | "invoice"
    | "expense"
    | "quotation"
    | "project"
    | "payroll"
    | "task"
    | "tool-request"
    | "tool-return"
    | "tool-maintenance"
    | "emergency-callout"
    | "leave-request"
    | "overtime-request";
  title: string;
  description: string;
  dueDate?: string;
  daysRemaining: number;
  priority?: "low" | "medium" | "high" | "critical";
}

interface AlertsHorizontalProps {
  isLoading: boolean;
  data: {
    alerts?: Alert[];
  };
}

export default function AlertsHorizontal({
  isLoading,
  data,
}: AlertsHorizontalProps) {
  const alerts: Alert[] = data?.alerts || [];
  const router = useRouter();

  // Function to handle alert navigation
  const handleAlertClick = (alert: Alert) => {
    // Extract the actual ID from the alert ID (format: "type-id")
    const idParts = alert.id.split("-");
    const actualId = idParts.slice(1).join("-"); // In case ID contains hyphens

    switch (alert.type) {
      case "invoice":
        router.push(`/dashboard/invoices/${actualId}`);
        break;
      case "expense":
        router.push(`/dashboard/expenses/${actualId}`);
        break;
      case "quotation":
        router.push(`/dashboard/quotations/${actualId}`);
        break;
      case "project":
        router.push(`/dashboard/projects/${actualId}`);
        break;
      case "task":
        router.push(`/dashboard/projects?taskId=${actualId}`);
        break;
      case "payroll":
        router.push(`/dashboard/payroll`);
        break;
      case "tool-request":
        router.push(`/dashboard/tools/tool-request`);
        break;
      case "tool-return":
        router.push(`/dashboard/tools/worker-tools/return`);
        break;
      case "tool-maintenance":
        router.push(`/dashboard/tools/tool-maintenance`);
        break;
      case "emergency-callout":
        router.push(`/dashboard/emergency-callouts`);
        break;
      case "leave-request":
        router.push(`/dashboard/human-resources/leaves`);
        break;
      case "overtime-request":
        router.push(`/dashboard/human-resources/attendence`);
        break;
      default:
        break;
    }
  };

  if (isLoading || alerts.length === 0) {
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
      case "tool-request":
        return <Hammer className="h-4 w-4" />;
      case "tool-return":
        return <RefreshCcw className="h-4 w-4" />;
      case "tool-maintenance":
        return <Bolt className="h-4 w-4" />;
      case "emergency-callout":
        return <Siren className="h-4 w-4 text-red-500" />;
      case "leave-request":
        return <CalendarX className="h-4 w-4" />;
      case "overtime-request":
        return <Timer className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Today's Alerts</span>
          <Badge variant="secondary" className="text-xs">
            {alerts.length}
          </Badge>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-3 pb-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className="flex flex-col gap-2 p-3 border rounded-lg w-[320px] h-[90px] bg-background cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
              >
                {/* Header Row */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(alert.priority)}`}
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.title}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge
                      variant={
                        alert.daysRemaining < 0
                          ? "destructive"
                          : alert.daysRemaining === 0
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {alert.daysRemaining < 0
                        ? "Overdue"
                        : alert.daysRemaining === 0
                          ? "Today"
                          : `${alert.daysRemaining}d`}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <div className="flex-1 min-h-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {alert.description}
                  </p>
                </div>

                {/* Footer */}
                {alert.dueDate && (
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(alert.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
