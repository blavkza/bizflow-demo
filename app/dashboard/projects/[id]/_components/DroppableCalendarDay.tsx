import { useDroppable } from "@dnd-kit/core";
import { CalendarTaskCard } from "./CalendarTaskCard";
import { Task } from "@/types/project";
import { isSameDay, parseISO, format } from "date-fns";

interface DroppableCalendarDayProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const DroppableCalendarDay = ({
  date,
  tasks,
  isCurrentMonth,
  isToday,
}: DroppableCalendarDayProps) => {
  const dateId = format(date, "yyyy-MM-dd");
  const { isOver, setNodeRef } = useDroppable({
    id: dateId,
  });

  const createdToday = tasks.filter(
    (task) => task.createdAt && isSameDay(parseISO(task.createdAt), date)
  );
  const dueToday = tasks.filter(
    (task) => task.dueDate && isSameDay(parseISO(task.dueDate), date)
  );

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] p-2 border border-border/30 rounded-md transition-all duration-200
        ${isCurrentMonth ? "bg-card/20" : "bg-muted/10 opacity-50"}
        ${isToday ? "ring-2 ring-primary/50 bg-primary/5" : ""}
        ${isOver ? "bg-primary/10 border-primary/50 scale-105" : ""}
        hover:bg-card/30
      `}
    >
      <div className="flex justify-between items-start">
        <div
          className={`
            text-sm font-medium mb-2 
            ${isToday ? "text-primary font-bold" : isCurrentMonth ? "" : "text-muted-foreground"}
          `}
        >
          {date.getDate()}
        </div>
        <div className="flex gap-1">
          {createdToday.length > 0 && (
            <span className="text-xs bg-blue-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
              {createdToday.length}
            </span>
          )}
          {dueToday.length > 0 && (
            <span className="text-xs bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
              {dueToday.length}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {tasks.map((task) => (
          <CalendarTaskCard key={task.id} task={task} currentDate={date} />
        ))}
      </div>
    </div>
  );
};
