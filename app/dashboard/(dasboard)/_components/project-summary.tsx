import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stat-card";

interface ProjectSummaryProps {
  isLoading: boolean;
  data: any;
}

export default function ProjectSummary({
  isLoading,
  data,
}: ProjectSummaryProps) {
  const projectData = data?.projectSummary || {};

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        isLoading={isLoading}
        title="Active Projects"
        value={projectData.activeProjects}
        change={projectData.activeChange}
        icon="folder"
      />
      <StatCard
        isLoading={isLoading}
        title="Completed Projects"
        value={projectData.completedProjects}
        change={projectData.completedChange}
        icon="check-square"
      />
      <StatCard
        isLoading={isLoading}
        title="Pending Projects"
        value={projectData.pendingProjects}
        change={projectData.pendingChange}
        icon="clock"
      />
      <StatCard
        isLoading={isLoading}
        title="Overdue Projects"
        value={projectData.overdueProjects}
        change={projectData.overdueChange}
        icon="alert-triangle"
      />
    </div>
  );
}
