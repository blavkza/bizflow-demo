"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Calendar,
  DollarSign,
  Receipt,
  User,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "../type";
import { getStatusColor, getPriorityColor, formatProjectDates } from "../utils";
import { teamMembers } from "@/lib/data";

interface ProjectOverviewProps {
  project: Project;
  projectStatus: string | null;
  projectProgress: number;
  budgetUsedPercentage: number;
  invoiceTotal: number;
}

export function ProjectOverview({
  project,
  projectStatus,
  projectProgress,
  budgetUsedPercentage,
  invoiceTotal,
}: ProjectOverviewProps) {
  const { startDate, endDate } = formatProjectDates(project);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Project Overview</CardTitle>
          <div className="flex gap-2">
            <Badge className={`${getStatusColor(projectStatus)} text-white`}>
              {projectStatus}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority} PRIORITY
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Building2 className="text-primary" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="text-sm">{project.client?.name || "No client"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-background">
              {project.manager?.avatar ? (
                <AvatarImage
                  src={project.manager?.avatar}
                  alt={`${project.manager?.name}`}
                />
              ) : (
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  <User className="text-primary" size={20} />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Project Manager</p>
              <p className="text-sm">{project.manager?.name || "Unassigned"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Team Size</p>
              <p className="text-sm ">
                {(project?.teamMembers?.length || 0) + 1}{" "}
                {project?.teamMembers?.length === 0 ? "Member" : "Members"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Timeline</p>
              <p className="text-sm ">
                {startDate} - {endDate}
              </p>
            </div>
          </div>
          {project.budget && (
            <div className="flex items-center gap-3">
              <DollarSign className="text-success" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-sm">
                  R {project.budget?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          )}
          {project.invoices && project.invoices.length > 0 && (
            <div className="flex items-center gap-3">
              <Receipt className="text-info" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
                <p className="text-sm">
                  R {invoiceTotal?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Project Progress</span>
            <span className="font-medium">{projectProgress}%</span>
          </div>
          <Progress value={projectProgress} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
