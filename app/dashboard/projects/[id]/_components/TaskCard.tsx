import { Task } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock } from "lucide-react";

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "in-progress":
        return "bg-yellow-500 text-primary-foreground";
      case "todo":
        return "bg-blue-500 text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-white";
      case "low":
        return "bg-info text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isOverdue =
    new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <Card className="transition-all duration-300 hover:shadow-md bg-gradient-to-br from-card to-card/80 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold line-clamp-1">
            {task.title}
          </CardTitle>
          <div className="flex gap-1">
            <Badge className={getStatusColor(task.status)} variant="secondary">
              {task.status.replace("-", " ")}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(task.assignee)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {task.assignee}
            </span>
          </div>
          <Badge className={getPriorityColor(task.priority)} variant="outline">
            {task.priority}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div
            className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
          >
            <Calendar size={14} />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
