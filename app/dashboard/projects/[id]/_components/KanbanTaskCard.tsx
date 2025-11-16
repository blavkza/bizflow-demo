import { Task } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Eye, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface KanbanTaskCardProps {
  task: Task;
  isDragging?: boolean;
  showDregButton?: boolean;
}

export const KanbanTaskCard = ({
  task,
  isDragging = false,
  showDregButton,
}: KanbanTaskCardProps) => {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => router.push(`/dashboard/projects/tasks/${task.id}`)}
      {...attributes}
      className={`
        bg-card/90 border border-border/50 rounded-lg p-3 space-y-3
        cursor-pointer active:cursor-grabbing transition-all duration-200
        hover:shadow-md hover:bg-card
        ${isDragging ? "opacity-50 rotate-3 scale-105" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium line-clamp-2 flex-1">
          {task.title}
        </h4>
        {showDregButton && (
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/20 rounded"
          >
            <GripVertical size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {allAssignees.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {visibleAssignees.map((assignee, index) => (
                <Avatar
                  key={`${assignee.type}-${assignee.firstName}`}
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
            <div className="text-xs text-muted-foreground">Unassigned</div>
          )}
        </div>
        {task.priority && (
          <Badge className={getPriorityColor(task.priority)} variant="outline">
            {task.priority}
          </Badge>
        )}
      </div>

      {task.dueDate && (
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Calendar size={12} />
            <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
          </div>
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">
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

      {/* Show task number if available */}
      {task.taskNumber && (
        <div className="text-xs text-muted-foreground text-right">
          #{task.taskNumber}
        </div>
      )}
    </div>
  );
};
