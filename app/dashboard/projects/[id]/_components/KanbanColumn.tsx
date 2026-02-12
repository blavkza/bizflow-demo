import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  tasks: Task[];
  showDregButton: boolean;
  onTaskDelete?: (taskId: string) => Promise<void>;
}

export const KanbanColumn = ({
  id,
  title,
  color,
  count,
  tasks,
  showDregButton,
  onTaskDelete,
}: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <Card
      className={`
        bg-gradient-to-br from-card to-card/80 border-border/50 transition-all duration-200  h-full
        ${isOver ? "ring-2 ring-primary/50 bg-primary/5" : ""}
      `}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span>{title}</span>
          </div>
          <Badge variant="secondary" className="bg-muted/50">
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div
          ref={setNodeRef}
          className={`
            min-h-[400px] space-y-3 p-2 rounded-md transition-all duration-200
            ${isOver ? "bg-primary/5 border-2 border-dashed border-primary/30" : "bg-muted/10"}
          `}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                showDregButton={showDregButton}
                onTaskDelete={onTaskDelete}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No tasks in {title.toLowerCase()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
