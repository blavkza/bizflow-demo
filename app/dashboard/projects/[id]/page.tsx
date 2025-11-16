"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { ProjectHeader } from "./_components/ProjectHeader";
import { ProjectOverview } from "./_components/ProjectOverview";
import { StatsCard } from "./_components/StatsCard";
import { ViewModeToggle } from "./_components/ViewModeToggle";
import { StatusFilter } from "./_components/StatusFilter";
import { InvoiceList } from "./_components/InvoiceList";
import { DraggableTaskCard } from "./_components/DraggableTaskCard";
import { CalendarView } from "./_components/CalendarView";
import { KanbanBoard } from "./_components/KanbanBoard";
import { ProjectFiles } from "./_components/project-files";
import { ProjectComments } from "./_components/project-comments";
import { ProjectTools } from "./_components/project-tools";
import { ProjectExpenses } from "./_components/project-expenses";
import TaskForm from "./_components/task-Form";
import ProjectForm from "../_components/project-Form";
import { WorkLogTab } from "./_components/WorkLogTab";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Project, Task, ViewMode } from "./type";
import {
  calculateBudgetUsedPercentage,
  calculateProjectProgress,
  calculateTaskStats,
} from "./utils";
import { cn } from "@/lib/utils";
import UploadFileDialog from "./_components/UploadFileDialog";
import { ProjectTeams } from "./_components/project-team";
import MemberForm from "./_components/Member-form";
import AddInvoiceDialog from "./_components/AddInvoiceDialog";
import { useQuery } from "@tanstack/react-query";
import { ProjectDetailsSkeleton } from "./_components/ProjectDetailsSkeleton";
import { useAuth } from "@clerk/nextjs";
import { WorkLogForm } from "./_components/work-log-form";

export default function ProjectsDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { userId } = useAuth();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectStatus, setProjectStatus] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectProgress, setProjectProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  async function fetchProjectData() {
    const response = await fetch(`/api/projects/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch Projects data");
    }
    return response.json();
  }

  async function fetchUserData(userId: string) {
    const response = await fetch(`/api/users/userId/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json();
  }

  const {
    data: user,
    isLoading: loadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["User", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
  });

  const {
    data,
    isLoading: loadingProjects,
    error: projectError,
    refetch,
  } = useQuery({
    queryKey: ["SingleProject", id],
    queryFn: fetchProjectData,
    refetchInterval: 10000,
  });

  useEffect(() => {
    const progress = calculateProjectProgress(tasks);
    setProjectProgress(progress);
  }, [tasks]);

  useEffect(() => {
    if (data) {
      setLoadingProject(loadingProjects);
      setProject(data);
      setTasks(data.tasks || []);
      setProjectStatus(data.status);
      setIsStarred(data.starred);

      const progress = calculateProjectProgress(data.tasks || []);
      setProjectProgress(progress);
    }

    if (projectError) {
      toast.error("Fail to fetch Projects data");
    }
  }, [data, loadingProjects, projectError]);

  const handleTaskUpdate = async (
    id: string,
    updateType: "status" | "dueDate",
    newValue: string
  ) => {
    try {
      const endpoint = updateType === "status" ? "status" : "due-date";
      const body =
        updateType === "status" ? { status: newValue } : { dueDate: newValue };

      const response = await fetch(`/api/tasks/${id}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task ${updateType}`);
      }

      refetch();

      return await response.json();
    } catch (error) {
      console.error(`Error updating task ${updateType}:`, error);
      throw error;
    }
  };

  const handleStar = async (isStarred: boolean) => {
    try {
      setIsStarred((prev) => !prev);
      const response = await fetch(`/api/projects/${project?.id}/star`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isStarred),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating project:`, error);
      toast.error(`Error updating project`);
      throw error;
    }
  };

  if (loadingProject) {
    return <ProjectDetailsSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-90vh">
        PROJECT NOT FOUND
      </div>
    );
  }

  const taskStats = calculateTaskStats(tasks);
  const invoiceTotal = project.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0
  );

  const budgetUsedPercentage = calculateBudgetUsedPercentage(project);

  const handleDragEnd = (event: DragEndEvent) => {
    // Handle list view drag end if needed
  };

  const currentUserId = user?.id;
  const managerId = project.managerId;

  const isManager = currentUserId === managerId;

  const currentMember = project.teamMembers?.find(
    (member) => member.userId === currentUserId
  );

  const currentUserRole = currentMember?.role || null;
  const currentUserPermissions = currentMember
    ? {
        canEditTask: currentMember.canEditTask,
        canDeleteTask: currentMember.canDeleteTask,
        canDeleteFiles: currentMember.canDeleteFiles,
        canCreateTask: currentMember.canCreateTask,
        canAddInvoice: currentMember.canAddInvoice,
        canUploadFiles: currentMember.canUploadFiles,
        canEditFile: currentMember.canEditFile,
        canViewFinancial: currentMember.canViewFinancial,
        canAddWorkLog: currentMember.canAddWorkLog || true,
      }
    : null;

  const Filtedtasks = tasks.filter((task) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "todo") return task.status === "TODO";
    if (statusFilter === "in-progress") return task.status === "IN_PROGRESS";
    if (statusFilter === "completed") return task.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-6 p-4">
      <ProjectHeader
        project={project}
        isStarred={isStarred}
        onStarToggle={() => handleStar(!isStarred)}
        onEditProject={() => setIsEditProjectDialogOpen(true)}
        onEditSettings={() => refetch()}
        onDeleteProject={() => router.push("/dashboard/projects")}
        user={user}
      />

      <ProjectOverview
        project={project}
        projectStatus={projectStatus}
        projectProgress={projectProgress}
        budgetUsedPercentage={budgetUsedPercentage}
        invoiceTotal={invoiceTotal}
      />

      <div className={cn("grid gap-4 grid-cols-1 md:grid-cols-4")}>
        <StatsCard
          value={taskStats.total}
          label="Total Tasks"
          className="text-primary"
        />
        <StatsCard
          value={taskStats.completed}
          label="Completed"
          className="text-success"
        />
        <StatsCard
          value={taskStats.inProgress}
          label="In Progress"
          className="text-info"
        />
        <StatsCard
          value={taskStats.todo}
          label="To Do"
          className="text-warning"
        />
      </div>

      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {viewMode === "invoices"
                ? "Invoices"
                : viewMode === "files"
                  ? "Files"
                  : viewMode === "team"
                    ? "Team Members"
                    : viewMode === "comments"
                      ? "Comments"
                      : viewMode === "tools"
                        ? "Tools"
                        : viewMode === "expenses"
                          ? "Expenses"
                          : viewMode === "worklogs"
                            ? "Work Logs"
                            : "Tasks"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <ViewModeToggle
                viewMode={viewMode}
                setViewMode={setViewMode}
                currentUserPermission={
                  currentUserPermissions?.canViewFinancial || null
                }
                currentUserRole={currentUserRole}
                isManager={isManager}
              />
              {viewMode === "invoices" &&
              (isManager || currentUserRole === "ADMIN") ? (
                <AddInvoiceDialog project={project} fetchProject={refetch} />
              ) : viewMode === "team" &&
                (isManager || currentUserRole === "ADMIN") ? (
                <MemberForm
                  project={project}
                  onSubmitSuccess={() => {
                    refetch();
                  }}
                />
              ) : viewMode === "files" &&
                (isManager || currentUserPermissions?.canUploadFiles) ? (
                <UploadFileDialog project={project} fetchProject={refetch} />
              ) : viewMode === "comments" &&
                (isManager || currentUserRole === "ADMIN") ? (
                <MemberForm
                  project={project}
                  onSubmitSuccess={() => {
                    refetch();
                  }}
                />
              ) : viewMode === "tools" &&
                (isManager || currentUserRole === "ADMIN") ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px] max-w-[1000px] max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm
                      type="create"
                      projectId={project.id}
                      onCancel={() => setIsDialogOpen(false)}
                      onSubmitSuccess={() => {
                        setIsDialogOpen(false);
                        refetch();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              ) : viewMode === "expenses" &&
                (isManager || currentUserRole === "ADMIN") ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px] max-w-[1000px] max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm
                      type="create"
                      projectId={project.id}
                      onCancel={() => setIsDialogOpen(false)}
                      onSubmitSuccess={() => {
                        setIsDialogOpen(false);
                        refetch();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              ) : viewMode === "worklogs" &&
                (isManager || currentUserPermissions?.canAddWorkLog) ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Work Log
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Work Log</DialogTitle>
                    </DialogHeader>
                    <WorkLogForm
                      projectId={project.id}
                      onSuccess={() => {
                        setIsDialogOpen(false);
                        refetch();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              ) : isManager || currentUserPermissions?.canCreateTask ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px] max-w-[1000px] max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm
                      type="create"
                      projectId={project.id}
                      onCancel={() => setIsDialogOpen(false)}
                      onSubmitSuccess={() => {
                        setIsDialogOpen(false);
                        refetch();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
          </div>

          {viewMode === "list" && (
            <StatusFilter
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          )}
        </CardHeader>
        <CardContent>
          {viewMode === "invoices" ? (
            <InvoiceList project={project} />
          ) : viewMode === "calendar" ? (
            <CalendarView
              tasks={tasks}
              setTasks={setTasks}
              onTaskUpdate={handleTaskUpdate}
            />
          ) : viewMode === "kanban" ? (
            <KanbanBoard
              tasks={tasks}
              setProjectStatus={setProjectStatus}
              setTasks={setTasks}
              onTaskUpdate={handleTaskUpdate}
              currentUserPermission={
                currentUserPermissions?.canEditTask || null
              }
              currentUserRole={currentUserRole}
              isManager={isManager}
            />
          ) : viewMode === "files" ? (
            <ProjectFiles
              project={project}
              fetchProject={refetch}
              canUploadFiles={currentUserPermissions?.canUploadFiles || null}
              canDeletFiles={currentUserPermissions?.canDeleteTask || null}
              canEditFiles={currentUserPermissions?.canEditFile || null}
              currentUserRole={currentUserRole}
              isManager={isManager}
            />
          ) : viewMode === "team" ? (
            <ProjectTeams
              teamMembers={project.teamMembers || []}
              projectId={project.id}
              onUpdateTeam={refetch}
              currentUserRole={currentUserRole}
              isManager={isManager}
            />
          ) : viewMode === "comments" ? (
            <ProjectComments
              fetchProject={refetch}
              user={user}
              project={project}
            />
          ) : viewMode === "tools" ? (
            <ProjectTools project={project} fetchProject={refetch} />
          ) : viewMode === "expenses" ? (
            <ProjectExpenses
              project={project}
              fetchProject={refetch}
              currentUserRole={currentUserRole}
              isManager={isManager}
              canViewFinancial={currentUserPermissions?.canViewFinancial}
            />
          ) : viewMode === "worklogs" ? (
            <WorkLogTab
              project={project}
              fetchProject={refetch}
              currentUserId={currentUserId}
              isManager={isManager}
              currentUserRole={currentUserRole}
            />
          ) : (
            <DndContext onDragEnd={handleDragEnd}>
              {Filtedtasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-muted-foreground mb-4 text-center">
                    {statusFilter === "all"
                      ? "Get started by creating your first Task."
                      : `No ${statusFilter
                          .toUpperCase()
                          .replace("_", " ")} projects found.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Filtedtasks.map((task) => (
                    <DraggableTaskCard
                      onDeleteTask={refetch}
                      key={task.id}
                      task={task}
                    />
                  ))}
                </div>
              )}
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
      >
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            type="update"
            onCancel={() => setIsEditProjectDialogOpen(false)}
            data={{
              id: project.id,
              title: project.title,
              description: project.description || undefined,
              managerId: project.managerId,
              clientId: project.clientId,
              priority: project.priority,
              startDate: project.startDate
                ? new Date(project.startDate)
                : undefined,
              endDate: project.endDate ? new Date(project.endDate) : undefined,
              deadline: project.deadline
                ? new Date(project.deadline)
                : undefined,
            }}
            onSubmitSuccess={() => {
              setIsEditProjectDialogOpen(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
