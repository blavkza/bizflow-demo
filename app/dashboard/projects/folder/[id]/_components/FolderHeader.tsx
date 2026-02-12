import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Grid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { FolderData } from "./types";
import UploadDialog from "./UploadDialog";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import FolderForm from "../../../[id]/_components/folder-Form";
import { useState } from "react";

interface FolderHeaderProps {
  folderData: FolderData;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onFileUpload: (files: File[]) => void;
  canUploadFiles?: boolean;
  userRole?: string | null;
  isManager?: boolean;
  refetch: () => void;
}

export default function FolderHeader({
  folderData,
  viewMode,
  onViewModeChange,
  onFileUpload,
  canUploadFiles = false,
  userRole = null,
  isManager = false,
  refetch,
}: FolderHeaderProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const canEditFolder = isManager;

  return (
    <div className="flex items-center gap-4">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        variant="outline"
        size="icon"
        className="shrink-0"
      >
        <ArrowLeft size={16} />
      </Button>

      {/* Title & Description */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold">{folderData.title}</h1>
        <p className="text-muted-foreground mt-1">{folderData.description}</p>
        {/* Role badge */}
        {(userRole || isManager) && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Your role:</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {isManager ? "Project Leader" : userRole}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Toggle View */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onViewModeChange(viewMode === "grid" ? "list" : "grid")
          }
          title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
        >
          {viewMode === "grid" ? (
            <List className="h-4 w-4" />
          ) : (
            <Grid className="h-4 w-4" />
          )}
        </Button>

        {/* Upload - Conditionally rendered based on permissions */}
        {canUploadFiles && <UploadDialog onFileUpload={onFileUpload} />}

        {canEditFolder && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="h-4 w-4 mr-1" />
                Edit Folder
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit folder ({folderData.title})</DialogTitle>
              </DialogHeader>

              <FolderForm
                type="update"
                projectId={folderData?.Project?.id!}
                onCancel={() => setIsDialogOpen(false)}
                data={{
                  id: folderData.id,
                  title: folderData.title,
                }}
                onSubmitSuccess={() => {
                  setIsDialogOpen(false);
                  refetch();
                }}
              />

              {/* Temporary placeholder until FolderForm is ready */}
              <div className="p-4 text-center text-muted-foreground">
                <p>Folder edit functionality coming soon...</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Permission indicators for non-managers without upload access */}
        {!canUploadFiles && !isManager && (
          <div className="text-xs text-muted-foreground italic">View only</div>
        )}
      </div>
    </div>
  );
}
