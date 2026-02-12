import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { CalendarTaskCard } from "./CalendarTaskCard";
import { Task } from "@/types/project";
import { DroppableCalendarDay } from "./DroppableCalendarDay";
import { startOfDay } from "date-fns";
import { toast } from "sonner";

interface CalendarViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onTaskUpdate: (
    taskId: string,
    updateType: "dueDate",
    newValue: string,
  ) => Promise<void>;
}

export const CalendarView = ({
  tasks,
  setTasks,
  onTaskUpdate,
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get the start of the week (Sunday) for the month start
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  // Get the end of the week (Saturday) for the month end
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => {
      const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
      const startTime = task.startTime ? parseISO(task.startTime) : null;

      return (
        (dueDate && isSameDay(dueDate, date)) ||
        (startTime && isSameDay(startTime, date))
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      const newDate = new Date(over.id as string);

      if (taskToUpdate) {
        const newDueDate = startOfDay(newDate);
        const newDueDateString = format(newDueDate, "yyyy-MM-dd");

        const originalDueDate = taskToUpdate.dueDate;

        // This might not trigger a re-render if the reference is the same
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, dueDate: newDueDateString } : task,
          ),
        );

        try {
          await onTaskUpdate(taskId, "dueDate", newDueDateString);
          // Add success feedback
          toast.success("Task due date updated successfully");
        } catch (error) {
          // Revert on error
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? { ...task, dueDate: originalDueDate } : task,
            ),
          );
          toast.error("Failed to update task due date");
        }
      }
    }

    setActiveTask(null);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon size={20} />
          Calendar View
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-lg font-semibold min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm">Start Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm">Due Date</span>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <DroppableCalendarDay
                key={day.toISOString()}
                date={day}
                tasks={dayTasks}
                isCurrentMonth={isCurrentMonth}
                isToday={isCurrentDay}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <CalendarTaskCard
              task={activeTask}
              isDragging
              currentDate={
                new Date(
                  activeTask.dueDate ||
                    activeTask.startTime ||
                    activeTask.createdAt ||
                    new Date(),
                )
              }
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
