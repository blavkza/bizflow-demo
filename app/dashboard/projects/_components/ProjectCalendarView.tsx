import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Projects } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { ProjectCalendarCard } from "../[id]/_components/ProjectCalendarCard";
import { useRouter } from "next/navigation";
import { DroppableProjectDay } from "./DroppableProjectDay";

interface ProjectCalendarViewProps {
  projects: Projects[];
}

export const ProjectCalendarView = ({ projects }: ProjectCalendarViewProps) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get the start of the week (Sunday) for the month start
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  // Get the end of the week (Saturday) for the month end
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getProjectsForDay = (date: Date) => {
    return projects.filter((project) => {
      if (!project.startDate || !project.endDate) return false;

      const parseProjectDate = (dateInput: string | Date): Date => {
        return typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
      };

      const startDate = parseProjectDate(project.startDate);
      const endDate = parseProjectDate(project.endDate);

      if (endDate < startDate) return false;

      return (
        isWithinInterval(date, { start: startDate, end: endDate }) ||
        isSameDay(date, startDate) ||
        isSameDay(date, endDate)
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const navigateToProjectdetails = (project: Projects) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon size={20} />
          Project Timeline
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

      {/* Weekday headers */}
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayProjects = getProjectsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <DroppableProjectDay
              key={day.toISOString()}
              date={day}
              projects={dayProjects}
              isCurrentMonth={isCurrentMonth}
              isToday={isCurrentDay}
              onProjectSelect={navigateToProjectdetails}
            />
          );
        })}
      </div>
    </div>
  );
};
