import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stat-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  PlayCircle,
  PauseCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface TaskSummaryProps {
  isLoading: boolean;
  data: any;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee: string;
  progress: number;
  project: string;
}

// Type-safe helper function
const calculateDistributionMetrics = (
  distribution: Record<string, unknown> | undefined
) => {
  const safeDistribution = distribution || {};
  const entries = Object.entries(safeDistribution);

  const total = entries.reduce((sum: number, [_, count]) => {
    const num = typeof count === "number" ? count : 0;
    return sum + num;
  }, 0);

  return entries.map(([key, count]) => ({
    key,
    count: typeof count === "number" ? count : 0,
    percentage: total > 0 ? Math.round((Number(count) / total) * 100) : 0,
  }));
};

export default function TaskSummary({ isLoading, data }: TaskSummaryProps) {
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  const taskData = data?.taskSummary || {};

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              isLoading={isLoading}
              title="Total Tasks"
              value={taskData.totalTasks}
              change={taskData.totalChange}
              icon="check-square"
              description={`${taskData.completedTasks || 0} completed`}
              onClick={() => setShowTaskDetails(true)}
            />
            <StatCard
              isLoading={isLoading}
              title="Completed"
              value={taskData.completedTasks}
              change={taskData.completedChange}
              icon="check-circle"
              description={`${taskData.inProgressTasks || 0} in progress`}
            />
            <StatCard
              isLoading={isLoading}
              title="In Progress"
              value={taskData.inProgressTasks}
              change={taskData.inProgressChange}
              icon="play-circle"
              description="Active tasks"
            />
            <StatCard
              isLoading={isLoading}
              title="Overdue"
              value={taskData.overdueTasks}
              change={taskData.overdueChange}
              icon="alert-triangle"
              description="Past due date"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Management</DialogTitle>
          </DialogHeader>
          <TaskDetailsDialog data={data} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Task Details Dialog Component
const TaskDetailsDialog = ({ data }: { data: any }) => {
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const recentTasks: Task[] = data?.recentTasks || [];
  const taskMetrics = data?.taskMetrics || {};

  const statusMetrics = calculateDistributionMetrics(
    taskMetrics.statusDistribution
  );
  const priorityMetrics = calculateDistributionMetrics(
    taskMetrics.priorityDistribution
  );

  const priorityFilters = [
    { value: "all", label: "All Priorities" },
    { value: "URGENT", label: "Urgent" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  const filteredTasks =
    selectedPriority === "all"
      ? recentTasks
      : recentTasks.filter((task) => task.priority === selectedPriority);

  const getPriorityColor = (priority: string) => {
    const colors = {
      URGENT: "bg-red-100 text-red-800 border-red-200",
      HIGH: "bg-orange-100 text-orange-800 border-orange-200",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
      LOW: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      colors[priority as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      COMPLETED: <CheckCircle className="h-4 w-4 text-green-600" />,
      IN_PROGRESS: <PlayCircle className="h-4 w-4 text-blue-600" />,
      PENDING: <Clock className="h-4 w-4 text-yellow-600" />,
      OVERDUE: <AlertTriangle className="h-4 w-4 text-red-600" />,
      ON_HOLD: <PauseCircle className="h-4 w-4 text-orange-600" />,
    };
    return (
      icons[status as keyof typeof icons] || (
        <Clock className="h-4 w-4 text-gray-600" />
      )
    );
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{task.title}</h4>
            <Badge
              variant="outline"
              className={getPriorityColor(task.priority)}
            >
              {task.priority}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{task.project}</span>
            <span>•</span>
            <span>{task.assignee}</span>
            <span>•</span>
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1" />
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit Task</DropdownMenuItem>
          <DropdownMenuItem>Change Status</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const StatusDistribution = () => {
    return (
      <div className="space-y-4">
        {statusMetrics.map(({ key, count, percentage }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getStatusIcon(key)}
                <span className="text-sm font-medium capitalize">
                  {key.toLowerCase().replace("_", " ")}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {percentage}%
                </div>
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        ))}
      </div>
    );
  };

  const PriorityDistribution = () => {
    return (
      <div className="space-y-3">
        {priorityMetrics.map(({ key, count }) => (
          <div key={key} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  key === "URGENT"
                    ? "bg-red-500"
                    : key === "HIGH"
                      ? "bg-orange-500"
                      : key === "MEDIUM"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                }`}
              />
              <span className="text-sm capitalize">{key.toLowerCase()}</span>
            </div>
            <Badge variant="secondary">{count}</Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="text-sm border rounded-md px-3 py-1"
                >
                  {priorityFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.slice(0, 10).map((task: Task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {filteredTasks.length > 10 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All Tasks ({filteredTasks.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks found</p>
                <p className="text-sm">Try changing your filters</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Analytics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDistribution />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <PriorityDistribution />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Task Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Average Completion Time</span>
                  <span className="font-medium">
                    {taskMetrics.avgCompletionTime || 0} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>On-Time Completion</span>
                  <span className="font-medium">
                    {taskMetrics.onTimeCompletionRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks Due This Week</span>
                  <span className="font-medium">
                    {taskMetrics.weeklyDueTasks || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
