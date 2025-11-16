"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Task } from "@/types/project";
import DeleteDialog from "./DeleteDialog";

interface DraggableTaskCardProps {
  task: Task;
  onDeleteTask: () => void;
}

export const DraggableTaskCard = ({
  task,
  onDeleteTask,
}: DraggableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500 text-white";
      case "IN_PROGRESS":
        return "bg-yellow-500 text-primary-foreground";
      case "TODO":
        return "bg-blue-500 text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-destructive text-destructive-foreground";
      case "MEDIUM":
        return "bg-orange-500 text-white";
      case "LOW":
        return "bg-yellow-500 text-white";
      default:
        return "bg-red-400 text-muted-foreground";
    }
  };

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return (
      `${firstName?.[0]?.toUpperCase() ?? ""}${lastName?.[0]?.toUpperCase() ?? ""}` ||
      "??"
    );
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETED";

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

  // Handle multiple assignees
  const maxVisibleAssignees = 3;
  const visibleAssignees = allAssignees.slice(0, maxVisibleAssignees);
  const extraAssigneesCount = Math.max(
    allAssignees.length - maxVisibleAssignees,
    0
  );

  return (
    <Card
      ref={setNodeRef}
      onClick={() => router.push(`/dashboard/projects/tasks/${task.id}`)}
      style={style}
      className={`
        transition-all duration-300 hover:shadow-md cursor-pointer bg-gradient-to-br from-card to-card/80 border-border/50
        ${isDragging ? "opacity-50 rotate-3 scale-105 shadow-lg" : ""}
      `}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold line-clamp-1 flex-1">
            {task.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* <DeleteDialog
              id={task.id}
              type="Task"
              fetchProject={onDeleteTask}
            /> */}
            <Badge
              className={`${getStatusColor(task.status)} text-white`}
              variant="outline"
            >
              {task.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          {allAssignees.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {visibleAssignees.map((assignee, index) => (
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
              {extraAssigneesCount > 0 && (
                <div
                  className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs"
                  title={`${extraAssigneesCount} more assignee${extraAssigneesCount !== 1 ? "s" : ""}`}
                >
                  +{extraAssigneesCount}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Unassigned</div>
          )}
          <Badge className={getPriorityColor(task.priority)} variant="outline">
            {task.priority}
          </Badge>
        </div>

        {task.dueDate && (
          <div className="flex items-center justify-between text-sm">
            <div
              className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
            >
              <Calendar size={14} />
              <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
            </div>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
        )}

        {task.estimatedHours && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock size={14} />
              <span>Estimated: {Number(task.estimatedHours) || 0} hrs</span>
            </div>
          </div>
        )}

        {/* Task number display */}
        {task.taskNumber && (
          <div className="text-xs text-muted-foreground text-right">
            #{task.taskNumber}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
