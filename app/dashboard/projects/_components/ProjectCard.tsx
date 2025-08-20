import { Projects } from "@/types/project"; // Only import Projects
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Users,
  User,
  DollarSign,
  Receipt,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  calculateProjectProgress,
  getPriorityColor,
  getStatusColor,
} from "../[id]/utils";

interface ProjectCardProps {
  project: Projects;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const router = useRouter();

  const handleProjectClick = (project: Projects) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const safeDateToString = (date: string | Date | null): string => {
    if (!date) return "N/A";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const invoiceTotal =
    project.invoice?.reduce(
      (sum, inv) => sum + Number(inv.totalAmount || 0),
      0
    ) ?? 0;

  const projectProgress = calculateProjectProgress(project.tasks);

  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-card to-card/80 border-border/50"
      onClick={() => handleProjectClick(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate pr-4">
            {project.title}
          </CardTitle>
          <div className="flex gap-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status === "ON_HOLD"
                ? "HOLD"
                : project.status.replace("_", " ")}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 size={16} />
            <span className="font-medium">
              {project.client?.company || project.client?.name || "No client"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={16} />
              <span>{project.manager?.name || "Unassigned"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(projectProgress)}%</span>
          </div>
          <Progress value={projectProgress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          {project.budget && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div>
                <span className="text-xs block">Budget</span>
                <span className="font-medium">
                  {project.budget
                    ? `R ${project.budget.toLocaleString()}`
                    : "N/A"}
                </span>
              </div>
            </div>
          )}
          {invoiceTotal > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div>
                <span className="text-xs block">Invoiced</span>

                <span className="font-medium">R {invoiceTotal}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{safeDateToString(project.startDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{safeDateToString(project.endDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
