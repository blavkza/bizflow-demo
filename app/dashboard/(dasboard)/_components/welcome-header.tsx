import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  CheckSquare,
  Briefcase,
  Calendar,
} from "lucide-react";
import { getInitials } from "@/lib/formatters";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";

interface WelcomeHeaderProps {
  isLoading: boolean;
  data: any;
}

const fallbackUser = {
  name: "User",
  avatar: null,
  createdAt: new Date().toISOString(),
};

export default function WelcomeHeader({ isLoading, data }: WelcomeHeaderProps) {
  const [openTasks, setOpenTasks] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);

  const financialData = data?.financialSummary || {};
  const taskData = data?.taskSummary || {};
  const projectData = data?.projectSummary || {};
  const employeeData = data?.employeeSummary || {};
  const freelancerData = data?.freelancerSummary || {};

  const currentUser = data?.currentUser || fallbackUser;

  // Financial metrics with proper fallbacks
  const financialMetrics = {
    monthlyRevenue: financialData.monthlyRevenue || 0,
    overallRevenue: financialData.overallRevenue || 0, // Now using actual overall revenue
    totalExpenses: financialData.totalExpensesAmount || 0,
    outstandingInvoices: financialData.overdueInvoicesAmount || 0,
    netProfit: financialData.netProfit || 0,
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={currentUser.avatar || "/placeholder-user.jpg"}
                  alt={currentUser.name}
                />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold">
                  Welcome, {currentUser.name} 👋
                </h2>
                <p className="text-muted-foreground text-sm">
                  {`Member since ${new Date(currentUser.createdAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenTasks(true)}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                View Tasks ({taskData.totalTasks || 0})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenProjects(true)}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                View Projects ({projectData.activeProjects || 0})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 pt-5">
            {/* This Month Revenue */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg bg-green-50 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">This Month Revenue</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatCurrency(financialMetrics.monthlyRevenue)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Current month income
                </p>
              </div>
            </div>

            {/* Overall Revenue - Now shows actual total from all payments */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg bg-blue-50 p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Overall Revenue</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatCurrency(financialMetrics.overallRevenue)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Total all-time income
                </p>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg bg-orange-50 p-3">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Expenses</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatCurrency(financialMetrics.totalExpenses)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  All expenses to date
                </p>
              </div>
            </div>

            {/* Outstanding Invoices */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg bg-purple-50 p-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Outstanding Invoices</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatCurrency(financialMetrics.outstandingInvoices)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Unpaid/overdue invoices
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {projectData.activeProjects || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Projects
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {taskData.completedTasks || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Completed Tasks
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(employeeData.activeEmployees || 0) +
                  (freelancerData.totalFreelancers || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {taskData.overdueTasks || 0}
              </div>
              <div className="text-sm text-muted-foreground">Overdue Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Dialog */}
      <Dialog open={openTasks} onOpenChange={setOpenTasks}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Tasks ({data?.allTasks?.length || 0})</DialogTitle>
          </DialogHeader>
          <TaskList data={data} />
        </DialogContent>
      </Dialog>

      {/* Projects Dialog */}
      <Dialog open={openProjects} onOpenChange={setOpenProjects}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Active Projects ({data?.projectSummary?.activeProjects || 0})
            </DialogTitle>
          </DialogHeader>
          <ProjectList data={data} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Task List Component (keep your existing implementation)
const TaskList = ({ data }: { data: any }) => {
  const tasks = data?.allTasks || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-sm">
        <div>Task</div>
        <div>Project</div>
        <div>Assignee</div>
        <div>Due Date</div>
        <div>Priority</div>
        <div>Status</div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className="grid grid-cols-6 gap-4 p-4 border rounded-lg hover:bg-gray-50 text-sm"
          >
            <div className="font-medium truncate">{task.title}</div>
            <div className="text-muted-foreground truncate">{task.project}</div>
            <div className="text-muted-foreground truncate">
              {task.assignee}
            </div>
            <div className="text-muted-foreground">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "No due date"}
            </div>
            <div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  task.priority === "URGENT"
                    ? "bg-red-100 text-red-800"
                    : task.priority === "HIGH"
                      ? "bg-orange-100 text-orange-800"
                      : task.priority === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                }`}
              >
                {task.priority}
              </span>
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
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Project List Component (keep your existing implementation)
const ProjectList = ({ data }: { data: any }) => {
  const projects = data?.projectMetrics?.topProjects || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-sm">
        <div>Project</div>
        <div>Client</div>
        <div>Budget</div>
        <div>Progress</div>
        <div>Status</div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {projects.map((project: any) => (
          <div
            key={project.id}
            className="grid grid-cols-5 gap-4 p-4 border rounded-lg hover:bg-gray-50 text-sm"
          >
            <div className="font-medium truncate">{project.title}</div>
            <div className="text-muted-foreground truncate">
              {project.client?.name || "No Client"}
            </div>
            <div className="text-muted-foreground">
              {formatCurrency(Number(project.budget || 0))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>
                  {project.tasks?.filter((t: any) => t.status === "COMPLETED")
                    .length || 0}
                  /{project.tasks?.length || 0} tasks
                </span>
                <span>
                  {Math.round(
                    (project.tasks?.filter((t: any) => t.status === "COMPLETED")
                      .length /
                      (project.tasks?.length || 1)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.round((project.tasks?.filter((t: any) => t.status === "COMPLETED").length / (project.tasks?.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  project.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : project.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : project.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {project.status}
              </span>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No projects found</p>
          </div>
        )}
      </div>
    </div>
  );
};
