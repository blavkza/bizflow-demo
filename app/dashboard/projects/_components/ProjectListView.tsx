"use client";

import { Projects } from "@/types/project";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { getPriorityColor, getStatusColor } from "../[id]/utils";

interface ProjectListViewProps {
  projects: Projects[];
}

// Add this helper function
const calculateProjectProgress = (tasks?: any[]): number => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

export const ProjectListView = ({ projects }: ProjectListViewProps) => {
  const router = useRouter();

  const handleProjectClick = (project: Projects) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Dates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleProjectClick(project)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold">{project.title}</span>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {project.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-muted-foreground" />
                    <span>
                      {project.client?.company ??
                        project.client?.name ??
                        "No client"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    <span>{project.manager?.name ?? "Unassigned"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <span>{project.stats?.totalTasks ?? 0} tasks</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Progress
                      value={calculateProjectProgress(project.tasks)}
                      className="h-2"
                    />
                    <span className="text-xs text-muted-foreground text-center">
                      {calculateProjectProgress(project.tasks)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status?.replace("_", " ") ?? "UNKNOWN"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority ?? "UNSET"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col text-sm text-muted-foreground">
                    <span>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                    <span>to</span>
                    <span>
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
