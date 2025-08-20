import { format } from "date-fns";
import { Project, Task } from "./type";

export const getStatusColor = (status: string | null) => {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-500 text-white";
    case "COMPLETED":
      return "bg-green-500 text-white";
    case "ON_HOLD":
      return "bg-orange-500 text-white";
    default:
      return "bg-zinc-700 dark:bg-zinc-200 text-white";
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-destructive text-white";
    case "MEDIUM":
      return "bg-orange-500 text-white";
    case "LOW":
      return "bg-yellow-500 text-white";
    default:
      return "bg-red-400 text-white";
  }
};

export const calculateProjectProgress = (tasks: Task[]): number => {
  if (!tasks.length) return 0;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

export const calculateBudgetUsedPercentage = (project: Project): number => {
  const budget = Number(project.budget) || 0;
  const spent = Number(project.budgetSpent) || 0;

  if (budget <= 0) return 0;

  const percentage = (spent / budget) * 100;
  return Math.min(Math.round(percentage), 100);
};

export const calculateTaskStats = (tasks: Task[]) => {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    todo: tasks.filter((t) => t.status === "TODO").length,
  };
};

export const formatProjectDates = (project: Project) => {
  return {
    startDate: project.startDate
      ? format(new Date(project.startDate), "MMM d, yyyy")
      : "Not set",
    endDate: project.endDate
      ? format(new Date(project.endDate), "MMM d, yyyy")
      : "Not set",
  };
};
