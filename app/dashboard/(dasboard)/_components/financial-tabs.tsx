import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stat-card";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskSummaryProps {
  isLoading: boolean;
  data: any;
}

export default function TaskSummary({ isLoading, data }: TaskSummaryProps) {
  const [showAllTasks, setShowAllTasks] = useState(false);

  const taskData = data?.taskSummary || {};

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              isLoading={isLoading}
              title="Total Tasks"
              value={taskData.totalTasks}
              change={taskData.totalChange}
              icon="check-square"
              onClick={() => setShowAllTasks(true)}
            />
            <StatCard
              isLoading={isLoading}
              title="Completed"
              value={taskData.completedTasks}
              change={taskData.completedChange}
              icon="check-circle"
              onClick={() => setShowAllTasks(true)}
            />
            <StatCard
              isLoading={isLoading}
              title="In Progress"
              value={taskData.inProgressTasks}
              change={taskData.inProgressChange}
              icon="play-circle"
              onClick={() => setShowAllTasks(true)}
            />
            <StatCard
              isLoading={isLoading}
              title="Overdue"
              value={taskData.overdueTasks}
              change={taskData.overdueChange}
              icon="alert-triangle"
              onClick={() => setShowAllTasks(true)}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllTasks} onOpenChange={setShowAllTasks}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Tasks</DialogTitle>
          </DialogHeader>
          <TaskList data={data} />
        </DialogContent>
      </Dialog>
    </>
  );
}

const TaskList = ({ data }: { data: any }) => {
  const tasks = data?.allTasks || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg font-semibold">
        <div>Task</div>
        <div>Project</div>
        <div>Assignee</div>
        <div>Due Date</div>
        <div>Status</div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className="grid grid-cols-5 gap-4 p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">{task.title}</div>
            <div className="text-sm text-gray-600">{task.project}</div>
            <div className="text-sm text-gray-600">{task.assignee}</div>
            <div className="text-sm">
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
            <div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  task.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : task.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : task.status === "OVERDUE"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">No tasks found</div>
        )}
      </div>
    </div>
  );
};
