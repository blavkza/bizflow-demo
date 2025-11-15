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
} from "lucide-react";
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
                className="flex items-center gap-3 p-3 border rounded-lg min-w-[280px] bg-background"
              >
                <div
                  className={`w-2 h-2 rounded-full ${getPriorityColor(alert.priority)}`}
                />

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {alert.description}
                  </p>
                  {alert.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(alert.dueDate), "MMM d")}
                    </p>
                  )}
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
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
