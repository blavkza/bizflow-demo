import { useState } from "react";
import { Task } from "@/types/project";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import { KanbanColumn } from "../_components/KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { toast } from "sonner";

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectStatus: React.Dispatch<React.SetStateAction<string | null>>;
  onTaskUpdate: (
    id: string,
    updateType: "status",
    newStatus: Task["status"]
  ) => Promise<void>;
  currentUserPermission: boolean | null;
  currentUserRole: string | null;
  isManager: boolean;
}

export const KanbanBoard = ({
  tasks,
  setTasks,
  onTaskUpdate,
  setProjectStatus,
  currentUserPermission,
  currentUserRole,
  isManager,
}: KanbanBoardProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const columns = [
    {
      id: "todo",
      title: "To Do",
      status: "TODO" as const,
      color: "bg-blue-500",
    },
    {
      id: "in-progress",
      title: "In Progress",
      status: "IN_PROGRESS" as const,
      color: "bg-yellow-500",
    },
    {
      id: "completed",
      title: "Completed",
      status: "COMPLETED" as const,
      color: "bg-green-500",
    },
  ];

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  const getTaskCounts = () => {
    return {
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      COMPLETED: tasks.filter((t) => t.status === "COMPLETED").length,
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const targetColumn = columns.find((col) => col.id === over.id);

    if (targetColumn && active.id !== over.id) {
      const activeTask = tasks.find((t) => t.id === active.id);

      if (activeTask && activeTask.status !== targetColumn.status) {
        const originalStatus = activeTask.status;

        // Update tasks optimistically
        const updatedTasks = tasks.map((task) =>
          task.id === active.id
            ? { ...task, status: targetColumn.status }
            : task
        );

        // This triggers the parent's useEffect and progress recalculation
        setTasks(updatedTasks);

        // Calculate new project status
        const allTasksCompleted = updatedTasks.every(
          (task) => task.status === "COMPLETED"
        );
        setProjectStatus(allTasksCompleted ? "COMPLETED" : "ACTIVE");

        try {
          await onTaskUpdate(
            active.id as string,
            "status",
            targetColumn.status
          );

          /*           toast.success("Task status updated");
           */
        } catch (error) {
          // Revert if API call fails
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === active.id ? { ...task, status: originalStatus } : task
            )
          );

          // Also revert project status
          const wereAllTasksCompleted = tasks.every(
            (task) => task.status === "COMPLETED"
          );
          setProjectStatus(wereAllTasksCompleted ? "COMPLETED" : "ACTIVE");

          console.error("Failed to update task status:", error);
          toast.error("Failed to update task status");
        }
      }
    }

    setActiveTask(null);
  };

  const taskCounts = getTaskCounts();

  const showDregButton =
    currentUserPermission || currentUserRole === "ADMIN" || isManager;

  return (
    <div>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.status);

            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                count={taskCounts[column.status]}
                tasks={columnTasks}
                showDregButton={showDregButton}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard
              task={activeTask}
              isDragging
              showDregButton={showDregButton}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
