import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  User,
  Flag,
  Trash2,
} from "lucide-react";
import { getPriorityColor, getStatusColor, Task } from "@/types/tasks";
import TaskForm from "../../../[id]/_components/task-Form";
import DeleteDialog from "../../../[id]/_components/DeleteDialog";
import { useRouter } from "next/navigation";

interface TaskDetailHeaderProps {
  task: Task;
  refetch: () => void;
}

export default function TaskDetailHeader({
  task,
  refetch,
}: TaskDetailHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const router = useRouter();

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft size={16} />
          </Button>
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}
          />
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
        </div>
        <div className="flex items-center space-x-4 ml-12">
          <Badge variant="outline" className="text-xs">
            {task.project.title}
          </Badge>

          <span className="text-sm text-muted-foreground">
            Created {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant={"ghost"} size={"sm"}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-w-[1000px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              type="update"
              projectId={task.project.id}
              data={{
                ...task,
                description: task.description || undefined,
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                startTime: task.startTime
                  ? new Date(task.startTime)
                  : undefined,
                endTime: task.endTime ? new Date(task.endTime) : undefined,
                allocatedTime: task.allocatedTime || undefined,
                estimatedHours: task.estimatedHours
                  ? Number(task.estimatedHours)
                  : undefined,
                assignees: task?.assignees?.map((a) => ({ id: a?.id })) || [],
                freeLancerAssignees:
                  task?.freeLancerAssignees?.map((f) => ({ id: f?.id })) || [],
              }}
              onCancel={() => setIsDialogOpen(false)}
              onSubmitSuccess={() => {
                setIsDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>

        <DeleteDialog
          id={task.id}
          type="Task"
          fetchProject={() =>
            router.push(`/dashboard/projects/${task.project.id}`)
          }
        />
      </div>
    </div>
  );
}
