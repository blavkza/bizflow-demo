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
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          isLoading={isLoading}
          title="Total Tasks"
          value={taskData.totalTasks || 0}
          icon="check-square"
          description={`${taskData.completedTasks || 0} completed`}
          onClick={() => setShowTaskDetails(true)}
        />
        <StatCard
          isLoading={isLoading}
          title="Completed"
          value={taskData.completedTasks || 0}
          icon="check-circle"
          description={`${taskData.inProgressTasks || 0} in progress`}
        />
        <StatCard
          isLoading={isLoading}
          title="In Progress"
          value={taskData.inProgressTasks || 0}
          icon="play-circle"
          description="Active tasks"
        />
        <StatCard
          isLoading={isLoading}
          title="Overdue"
          value={taskData.overdueTasks || 0}
          icon="alert-triangle"
          description="Past due date"
        />
      </div>

      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const router = useRouter();

  // Transform and filter tasks
  const transformedTasks: Task[] = useMemo(() => {
    const rawTasks = data?.recentTasks || data?.allTasks || [];

    return rawTasks.map((task: any) => ({
      id: task.id || Math.random().toString(),
      title: task.title || "Untitled Task",
      status: task.status?.toUpperCase() || "PENDING",
      priority: task.priority?.toUpperCase() || "MEDIUM",
      dueDate: task.dueDate || task.createdAt || new Date().toISOString(),
      assignee: task.assignee || "Unassigned",
      progress:
        typeof task.progress === "number"
          ? task.progress
          : task.status === "COMPLETED"
            ? 100
            : 0,
      project: task.project || "No Project",
    }));
  }, [data]);

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    let filtered = transformedTasks;

    // Priority filter
    if (selectedPriority !== "all") {
      filtered = filtered.filter((task) => task.priority === selectedPriority);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((task) => task.status === selectedStatus);
    }

    // Date filter
    const now = new Date();
    if (dateFilter !== "all") {
      filtered = filtered.filter((task) => {
        const dueDate = new Date(task.dueDate);
        switch (dateFilter) {
          case "overdue":
            return dueDate < now && task.status !== "COMPLETED";
          case "today":
            return dueDate.toDateString() === now.toDateString();
          case "week":
            const weekFromNow = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            return dueDate <= weekFromNow && dueDate >= now;
          case "month":
            const monthFromNow = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              now.getDate()
            );
            return dueDate <= monthFromNow && dueDate >= now;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [transformedTasks, selectedPriority, selectedStatus, dateFilter]);

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

  const statusFilters = [
    { value: "all", label: "All Statuses" },
    { value: "COMPLETED", label: "Completed" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "PENDING", label: "Pending" },
    { value: "ON_HOLD", label: "On Hold" },
  ];

  const dateFilters = [
    { value: "all", label: "All Dates" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Due Today" },
    { value: "week", label: "Due This Week" },
    { value: "month", label: "Due This Month" },
  ];

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

  const getStatusColor = (status: string) => {
    const colors = {
      COMPLETED: "text-green-600 bg-green-50",
      IN_PROGRESS: "text-blue-600 bg-blue-50",
      PENDING: "text-yellow-600 bg-yellow-50",
      OVERDUE: "text-red-600 bg-red-50",
      ON_HOLD: "text-orange-600 bg-orange-50",
    };
    return colors[status as keyof typeof colors] || "text-gray-600 bg-gray-50";
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const isOverdue =
      new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
    const displayStatus = isOverdue ? "OVERDUE" : task.status;

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-shrink-0">{getStatusIcon(displayStatus)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{task.title}</h4>
              <Badge
                variant="outline"
                className={getPriorityColor(task.priority)}
              >
                {task.priority.toLowerCase()}
              </Badge>
              <Badge
                variant="secondary"
                className={getStatusColor(displayStatus)}
              >
                {displayStatus.toLowerCase().replace("_", " ")}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="truncate">{task.project}</span>
              <span>•</span>
              <span className="truncate">{task.assignee}</span>
              <span>•</span>
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && " (Overdue)"}
              </span>
            </div>

            {/*  <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-1" />
            </div> */}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/projects/tasks/${task.id}`)
              }
            >
              View Details
            </DropdownMenuItem>
            {/* <DropdownMenuItem>Edit Task</DropdownMenuItem>
            <DropdownMenuItem>Change Status</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

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
        {priorityMetrics.map(({ key, count, percentage }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle>Task Management</CardTitle>
              <div className="flex flex-wrap gap-2">
                {/* Priority Filter */}
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

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-sm border rounded-md px-3 py-1"
                >
                  {statusFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-sm border rounded-md px-3 py-1"
                >
                  {dateFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>

                {/* Reset Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPriority("all");
                    setSelectedStatus("all");
                    setDateFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredTasks.length} of {transformedTasks.length} tasks
            </div>

            {filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.slice(0, 10).map((task: Task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {/*    {filteredTasks.length > 10 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All Tasks ({filteredTasks.length})
                  </Button>
                )} */}
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
                {/*   <div className="flex justify-between">
                  <span>Average Completion Time</span>
                  <span className="font-medium">
                    {taskMetrics.avgCompletionTime || "not calculated"} days
                  </span>
                </div> */}
                {/* <div className="flex justify-between">
                  <span>On-Time Completion</span>
                  <span className="font-medium">
                    {taskMetrics.onTimeCompletionRate || 78.3}%
                  </span>
                </div> */}
                <div className="flex justify-between">
                  <span>Tasks Due This Week</span>
                  <span className="font-medium">
                    {taskMetrics.weeklyDueTasks || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tasks</span>
                  <span className="font-medium">{transformedTasks.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
