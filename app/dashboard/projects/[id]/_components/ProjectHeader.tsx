"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Share, Edit, Settings, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Project } from "../type";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { Dialog } from "@/components/ui/dialog";
import ProjectForm from "../../_components/project-Form";
import { Badge } from "@/components/ui/badge";
import { ProjectSettings } from "./ProjectSettingsForm";
import DeleteDialog from "./DeleteDialog";
import { User } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectReportGenerator } from "@/lib/ProjectReportGenerator";
import { useCompanyInfo } from "@/hooks/use-company-info";

interface ProjectHeaderProps {
  project: Project;
  isStarred: boolean;
  onStarToggle: () => void;
  onEditProject: () => void;
  onEditSettings: () => void;
  onDeleteProject: () => void;
  user: User;
}

export function ProjectHeader({
  project,
  isStarred,
  onStarToggle,
  onEditProject,
  onEditSettings,
  onDeleteProject,
  user,
}: ProjectHeaderProps) {
  const router = useRouter();
  const [isPrinting, setIsPrinting] = useState(false);
  const isManager = user?.id === project.managerId;
  const isCEO = user?.role === "CHIEF_EXECUTIVE_OFFICER";
  const hasEditPermissions = isManager || isCEO;

  const { companyInfo } = useCompanyInfo();

  const handlePrintReport = async () => {
    setIsPrinting(true);
    try {
      const projectReportHTML =
        ProjectReportGenerator.generateProjectReportHTML(project, companyInfo);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(projectReportHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing project report:", error);
      toast.error("Failed to generate project report");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={() => router.back()}
        variant="outline"
        size="icon"
        className="shrink-0"
      >
        <ArrowLeft size={16} />
      </Button>

      <div className="flex-1">
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <p className="text-muted-foreground mt-1">{project.description}</p>
      </div>

      {hasEditPermissions && (
        <>
          <div onClick={onStarToggle} className="cursor-pointer">
            {isStarred ? (
              <Badge className="bg-yellow-500/50 text-white flex items-center gap-1 hover:bg-yellow-500/30">
                Favorited{" "}
                <IoStar size={20} className="text-yellow-400 rounded-full" />
              </Badge>
            ) : (
              <Badge className="bg-gray-200 text-gray-700 flex items-center gap-1">
                Mark as Favorite <IoStar size={20} className="text-gray-500" />
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReport}
              disabled={isPrinting}
            >
              <FileText className="w-4 h-4 mr-1" />
              {isPrinting ? "Generating..." : "Report"}
            </Button>

            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>

            <Button variant="outline" size="sm" onClick={onEditProject}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>

            <ProjectSettings project={project} onSuccess={onEditSettings} />

            <DeleteDialog
              id={project.id}
              type="Project"
              fetchProject={onDeleteProject}
            />
          </div>
        </>
      )}
    </div>
  );
}
