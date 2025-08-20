import { Projects } from "@/types/project";
import { ProjectCalendarCard } from "../[id]/_components/ProjectCalendarCard";

interface DroppableProjectDayProps {
  date: Date;
  projects: Projects[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onProjectSelect: (project: Projects) => void; // Changed from Project to Projects
}

export const DroppableProjectDay = ({
  date,
  projects,
  isCurrentMonth,
  isToday,
  onProjectSelect,
}: DroppableProjectDayProps) => {
  return (
    <div
      className={`
        min-h-[120px] p-2 border border-border/30 rounded-md transition-all duration-200
        ${isCurrentMonth ? "bg-card/20" : "bg-muted/10 opacity-50"}
        ${isToday ? "ring-2 ring-primary/50 bg-primary/5" : ""}
        hover:bg-card/30
      `}
    >
      <div
        className={`
        text-sm font-medium mb-2 
        ${isToday ? "text-primary font-bold" : isCurrentMonth ? "" : "text-muted-foreground"}
      `}
      >
        {date.getDate()}
      </div>

      <div className="space-y-1">
        {projects.map((project) => (
          <ProjectCalendarCard
            key={project.id}
            project={project}
            date={date}
            onProjectSelect={onProjectSelect}
          />
        ))}
      </div>
    </div>
  );
};
