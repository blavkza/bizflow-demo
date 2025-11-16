import { Task } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Users } from "lucide-react";

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  console.log(task);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500 text-white";
      case "IN_PROGRESS":
        return "bg-yellow-500 text-primary-foreground";
      case "TODO":
        return "bg-blue-500 text-white";
      case "ON_HOLD":
        return "bg-orange-500 text-white";
      case "CANCELLED":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-destructive text-destructive-foreground";
      case "MEDIUM":
        return "bg-warning text-white";
      case "LOW":
        return "bg-info text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatStatus = (status: string) => {
    return status.toLowerCase().replace("_", " ");
  };

  const formatPriority = (priority: string) => {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  };

  const isOverdue =
    new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";

  // Combine all assignees (employees and freelancers)
  const allAssignees = [
    ...(task.assignees?.map((assignee) => ({
      ...assignee,
      fullName: getFullName(assignee.firstName, assignee.lastName),
      initials: getInitials(assignee.firstName, assignee.lastName),
      type: "employee" as const,
    })) || []),
    ...(task.freeLancerAssignees?.map((freelancer) => ({
      ...freelancer,
      fullName: getFullName(freelancer.firstName, freelancer.lastName),
      initials: getInitials(freelancer.firstName, freelancer.lastName),
      type: "freelancer" as const,
    })) || []),
  ];

  return (
    <Card className="transition-all duration-300 hover:shadow-md bg-gradient-to-br from-card to-card/80 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
            {task.title}
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            <Badge
              className={`${getStatusColor(task.status)} text-xs`}
              variant="secondary"
            >
              {formatStatus(task.status)}
            </Badge>
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {task.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Assignees Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allAssignees.length > 0 ? (
              <>
                <Users size={14} className="text-muted-foreground" />
                <div className="flex -space-x-2">
                  {allAssignees.slice(0, 3).map((assignee, index) => (
                    <Avatar
                      key={`${assignee.type}-${assignee.initials}`}
                      className="w-6 h-6 border-2 border-background"
                      title={assignee.fullName}
                    >
                      {assignee.avatar ? (
                        <AvatarImage
                          src={assignee.avatar}
                          alt={assignee.fullName}
                        />
                      ) : (
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {assignee.initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  {allAssignees.length > 3 && (
                    <Avatar className="w-6 h-6 border-2 border-background">
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        +{allAssignees.length - 3}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {allAssignees.length} assignee
                  {allAssignees.length !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Users size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Unassigned
                </span>
              </div>
            )}
          </div>
          <Badge
            className={`${getPriorityColor(task.priority)} text-xs`}
            variant="outline"
          >
            {formatPriority(task.priority)}
          </Badge>
        </div>

        {/* Due Date and Overdue Status */}
        <div className="flex items-center justify-between text-sm">
          <div
            className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
          >
            <Calendar size={14} />
            <span>
              Due:{" "}
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "No due date"}
            </span>
          </div>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        {/* Estimated Hours */}
        {task.estimatedHours && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>Est: {task.estimatedHours.toString()}h</span>
          </div>
        )}

        {/* Task Number */}
        {task.taskNumber && (
          <div className="text-xs text-muted-foreground">
            #{task.taskNumber}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
