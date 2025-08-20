import { type Projects } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { parseISO, isSameDay, isValid, isWithinInterval } from "date-fns";
import { calculateProjectProgress } from "../utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface ProjectCalendarCardProps {
  project: Projects;
  date: Date;
  onProjectSelect: (project: Projects) => void;
  className?: string;
  isSelected?: boolean;
}

const statusVariantMap = {
  active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    rangeBg: "bg-emerald-500/5",
  },
  completed: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    border: "border-indigo-500/20",
    rangeBg: "bg-indigo-500/5",
  },
  on_hold: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    rangeBg: "bg-amber-500/5",
  },
  "on-hold": {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    rangeBg: "bg-amber-500/5",
  },
  planned: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    rangeBg: "bg-blue-500/5",
  },
  cancelled: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-500/20",
    rangeBg: "bg-rose-500/5",
  },
  default: {
    bg: "bg-gray-500/10",
    text: "text-gray-600",
    border: "border-gray-500/20",
    rangeBg: "bg-gray-500/5",
  },
} as const;

export const ProjectCalendarCard = ({
  project,
  date,
  onProjectSelect,
  className,
  isSelected = false,
}: ProjectCalendarCardProps) => {
  const parseSafeDate = (dateString: string | Date | null): Date | null => {
    if (!dateString) return null;
    try {
      const dateObj =
        typeof dateString === "string" ? parseISO(dateString) : dateString;
      return isValid(dateObj) ? dateObj : null;
    } catch {
      return null;
    }
  };

  const startDate = parseSafeDate(project.startDate);
  const endDate = parseSafeDate(project.endDate);

  const isStartDate = startDate ? isSameDay(date, startDate) : false;
  const isEndDate = endDate ? isSameDay(date, endDate) : false;
  const isWithinRange =
    startDate && endDate
      ? isWithinInterval(date, { start: startDate, end: endDate })
      : false;

  const statusKey = project.status
    .toLowerCase()
    .replace(/-/g, "_") as keyof typeof statusVariantMap;
  const statusVariant = statusVariantMap[statusKey] || statusVariantMap.default;

  const projectProgress = calculateProjectProgress(project.tasks);
  const progressVariant =
    projectProgress >= 90
      ? "success"
      : projectProgress >= 50
        ? "primary"
        : "warning";

  const formatStatus = (status: string) => {
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getBackgroundClass = () => {
    if (isStartDate)
      return "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5";
    if (isEndDate) return "bg-gradient-to-l from-rose-500/15 to-rose-500/5";
    if (isWithinRange) return statusVariant.rangeBg;
    return statusVariant.bg;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          onClick={() => onProjectSelect(project)}
          className={cn(
            "p-3 rounded-xl border transition-all duration-200",
            "cursor-pointer relative overflow-hidden group",
            "hover:shadow-sm hover:translate-y-[-2px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            getBackgroundClass(),
            statusVariant.border,
            isSelected && "ring-2 ring-offset-1 ring-primary",
            isStartDate && "border-l-[3px] border-l-emerald-500",
            isEndDate && "border-r-[3px] border-r-rose-500",
            className
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          tabIndex={0}
        >
          {(isStartDate || isEndDate) && (
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              {isStartDate && (
                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
              )}
              {isEndDate && (
                <div className="absolute right-0 top-0 h-full w-1 bg-rose-500" />
              )}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  "bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))]",
                  isStartDate
                    ? "from-emerald-500/10"
                    : isEndDate
                      ? "from-rose-500/10"
                      : "from-primary/10",
                  "to-transparent pointer-events-none"
                )}
              />
            </div>
          )}

          <div className="relative z-10 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={cn(
                  "text-sm font-semibold line-clamp-1",
                  "bg-gradient-to-r from-foreground/80 to-foreground/90",
                  "bg-clip-text text-transparent",
                  statusVariant.text
                )}
              >
                {project.title}
              </h4>

              <Badge
                className={cn(
                  "scale-90 origin-top-right transition-transform",
                  "border bg-background/80 backdrop-blur-sm",
                  "group-hover:scale-100 group-hover:shadow-xs",
                  statusVariant.text,
                  statusVariant.border
                )}
                variant="outline"
              >
                {formatStatus(project.status)}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {project.client?.name || "Unassigned"}
              </span>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  progressVariant === "success"
                    ? "text-emerald-500"
                    : progressVariant === "primary"
                      ? "text-blue-500"
                      : "text-amber-500"
                )}
              >
                {Math.round(projectProgress)}%
              </span>
            </div>

            <Progress
              value={projectProgress}
              className={cn(
                "h-1.5 bg-background/30",
                progressVariant === "success"
                  ? "[&>div]:bg-emerald-500"
                  : progressVariant === "primary"
                    ? "[&>div]:bg-blue-500"
                    : "[&>div]:bg-amber-500"
              )}
            />

            {(isStartDate || isEndDate) && (
              <div className="flex items-center gap-2 text-xs">
                {isStartDate && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Start Date
                  </span>
                )}
                {isEndDate && (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    End Date
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </TooltipTrigger>

      <TooltipContent side="top" align="start" className="max-w-[300px]">
        <div className="space-y-1">
          <h4 className="font-semibold">{project.title}</h4>
          <p className="text-sm text-muted-foreground">
            {project.description || "No description provided"}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs">
              {startDate?.toLocaleDateString() || "No start date"} →{" "}
              {endDate?.toLocaleDateString() || "No end date"}
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(projectProgress)}% complete
            </Badge>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
