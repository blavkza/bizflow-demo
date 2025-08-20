import { Badge } from "@/components/ui/badge";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { type Task } from "@/types/project";
import { format, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarTaskCardProps {
  task: Task;
  currentDate: Date;
  isDragging?: boolean;
}

const statusVariantMap = {
  COMPLETED: {
    text: "text-emerald-600",
    border: "border-emerald-500/30",
  },
  IN_PROGRESS: {
    text: "text-amber-600",
    border: "border-amber-500/30",
  },
  TODO: {
    text: "text-blue-600",
    border: "border-blue-500/30",
  },
  default: {
    text: "text-gray-600",
    border: "border-gray-500/30",
  },
} as const;

const priorityVariantMap = {
  URGENT: {
    text: "text-rose-600",
    border: "border-rose-500/30",
  },
  MEDIUM: {
    text: "text-orange-600",
    border: "border-orange-500/30",
  },
  LOW: {
    text: "text-yellow-600",
    border: "border-yellow-500/30",
  },
  default: {
    text: "text-gray-600",
    border: "border-gray-500/30",
  },
} as const;

export const CalendarTaskCard = ({
  task,
  currentDate,
  isDragging = false,
}: CalendarTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const statusKey = task.status as keyof typeof statusVariantMap;
  const statusVariant = statusVariantMap[statusKey] || statusVariantMap.default;

  const priorityKey = task.priority as keyof typeof priorityVariantMap;
  const priorityVariant =
    priorityVariantMap[priorityKey] || priorityVariantMap.default;

  const isCreatedToday =
    task.createdAt && isSameDay(parseISO(task.createdAt), currentDate);
  const isDueToday =
    task.dueDate && isSameDay(parseISO(task.dueDate), currentDate);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className={cn(
            "p-3 rounded-lg border bg-card/80 backdrop-blur-sm",
            "cursor-grab active:cursor-grabbing relative",
            "hover:shadow-sm hover:translate-y-[-1px] transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            statusVariant.border,
            isDragging && "opacity-70 scale-105 rotate-1 z-50 shadow-lg",
            isCreatedToday && "border-l-[3px] border-l-blue-500",
            isDueToday && "border-r-[3px] border-r-rose-500"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={cn(
                  "text-sm font-medium line-clamp-1 flex-1",
                  statusVariant.text
                )}
              >
                {task.title}
              </h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={cn(
                      "scale-90 origin-top-right transition-transform",
                      "border bg-background/80 backdrop-blur-sm",
                      "hover:scale-100 hover:shadow-xs",
                      priorityVariant.text,
                      priorityVariant.border
                    )}
                    variant="outline"
                  >
                    {task.priority.charAt(0).toUpperCase()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Priority: {task.priority}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {task.createdAt && (
                  <span
                    className={
                      isCreatedToday ? "text-blue-500 font-medium" : ""
                    }
                  >
                    {format(parseISO(task.createdAt), "MMM d")}
                  </span>
                )}
                {task.dueDate && (
                  <>
                    <span>→</span>
                    <span
                      className={isDueToday ? "text-rose-500 font-medium" : ""}
                    >
                      {format(parseISO(task.dueDate), "MMM d")}
                    </span>
                  </>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={cn(
                      "scale-90 origin-bottom-right transition-transform",
                      "border bg-background/80 backdrop-blur-sm",
                      "hover:scale-100 hover:shadow-xs",
                      statusVariant.text,
                      statusVariant.border
                    )}
                    variant="outline"
                  >
                    {task.status.charAt(0).toUpperCase()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Status: {task.status.replace(/_/g, " ")}
                </TooltipContent>
              </Tooltip>
            </div>

            {(isCreatedToday || isDueToday) && (
              <div className="flex items-center gap-2 text-xs">
                {isCreatedToday && (
                  <span className="inline-flex items-center gap-1 text-blue-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Created
                  </span>
                )}
                {isDueToday && (
                  <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Due
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </TooltipTrigger>

      <TooltipContent side="top" align="start" className="max-w-[300px]">
        <div className="space-y-2">
          <h4 className="font-medium">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-xs font-medium">
                {task.createdAt
                  ? format(parseISO(task.createdAt), "MMM d, yyyy")
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Due</p>
              <p
                className={cn(
                  "text-xs font-medium",
                  isDueToday && "text-rose-500"
                )}
              >
                {task.dueDate
                  ? format(parseISO(task.dueDate), "MMM d, yyyy")
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                className={cn("text-xs", statusVariant.text, "bg-background")}
                variant="outline"
              >
                {task.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Priority</p>
              <Badge
                className={cn("text-xs", priorityVariant.text, "bg-background")}
                variant="outline"
              >
                {task.priority}
              </Badge>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
