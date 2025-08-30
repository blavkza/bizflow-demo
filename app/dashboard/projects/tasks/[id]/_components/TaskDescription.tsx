import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types/tasks";

interface TaskDescriptionProps {
  task: Task;
}

export default function TaskDescription({ task }: TaskDescriptionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">
          {task.description || "No description provided."}
        </p>
      </CardContent>
    </Card>
  );
}
