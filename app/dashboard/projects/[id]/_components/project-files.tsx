"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Search,
  FileText,
  Download,
  MoreHorizontal,
  FolderOpen,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import FolderForm from "./folder-Form";
import { Project } from "../type";
import { format } from "date-fns";
import DeleteDialog from "./DeleteDialog";
import { ShareDialog } from "./ShareDialog";
import EditFolderDialog from "./EditFolderDialog";

import { FilePreviewDialog } from "./FilePreviewDialog";

interface ProjectFilesProps {
  project: Project;
  fetchProject: () => void;
  canUploadFiles: boolean | null;
  canDeletFiles: boolean | null;
  currentUserRole: string | null;
  canEditFiles: boolean | null;
  isManager: boolean;
}

interface FileTypeIconProps {
  type: string;
  className?: string;
}

const FileTypeIcon = ({ type, className }: FileTypeIconProps) => {
  const iconClasses = `h-5 w-5 ${className || ""}`;
  switch (type) {
    case "pdf":
      return <FileText className={`${iconClasses} text-red-500`} />;
    case "doc":
    case "docx":
      return <FileText className={`${iconClasses} text-blue-500`} />;
    case "xls":
    case "xlsx":
      return <FileText className={`${iconClasses} text-green-500`} />;
    case "ppt":
    case "pptx":
      return <FileText className={`${iconClasses} text-orange-500`} />;
    case "jpg":
    case "png":
    case "gif":
      return <FileText className={`${iconClasses} text-purple-500`} />;
    default:
      return <FileText className={`${iconClasses} text-gray-500`} />;
  }
};

const FileTypeBadge = ({ type }: { type: string }) => {
  const getFileTypeColor = () => {
    switch (type) {
      case "pdf":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "doc":
      case "docx":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "xls":
      case "xlsx":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "jpg":
      case "png":
      case "gif":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Badge className={`text-xs ${getFileTypeColor()}`}>
      {type.toUpperCase()}
    </Badge>
  );
};

const parseSizeToBytes = (sizeString: string | undefined | null): number => {
  if (!sizeString) return 0;
  const sizeStr = String(sizeString).trim();
  if (/^\d+$/.test(sizeStr)) {
    return parseInt(sizeStr, 10);
  }
  const sizeMatch = sizeStr.match(/(\d+\.?\d*)\s*(KB|MB|GB|B)/i);
  if (!sizeMatch) return 0;
  const size = parseFloat(sizeMatch[1]);
  const unit = sizeMatch[2].toUpperCase();
  switch (unit) {
    case "KB":
      return size * 1024;
    case "MB":
      return size * 1024 * 1024;
    case "GB":
      return size * 1024 * 1024 * 1024;
    default:
      return size;
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function ProjectFiles({
  project,
  fetchProject,
  canDeletFiles,
  canUploadFiles,
  currentUserRole,
  canEditFiles,
  isManager,
}: ProjectFilesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // CHANGED: Store the whole file object, not just url/type
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  if (!project) {
    return (
      <div className="flex items-center justify-center text-center h-90vh">
        <h2 className="text-lg text-center text-muted-foreground">NO Files</h2>
      </div>
    );
  }

  const showEditButton =
    canEditFiles || currentUserRole === "ADMIN" || isManager;
  const showDeleteButton =
    canDeletFiles || currentUserRole === "ADMIN" || isManager;
  const showUploadButton =
    canUploadFiles || currentUserRole === "ADMIN" || isManager;

  const folders = project.Folder || [];
  const documents = project.documents || [];

  const filteredFolders = folders.filter((folder) =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = documents.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateTotalStorageUsed = (): number => {
    const getDocSize = (size?: string | null): number => {
      const bytes = parseSizeToBytes(size);
      return bytes;
    };

    try {
      const folderDocsSize = (folders ?? []).reduce((total, folder) => {
        const folderSize = (folder.Document ?? []).reduce((sum, doc) => {
          const docSize = getDocSize(doc?.size);
          return sum + docSize;
        }, 0);
        return total + folderSize;
      }, 0);

      const rootDocsSize = (documents ?? []).reduce((sum, doc) => {
        const docSize = getDocSize(doc?.size);
        return sum + docSize;
      }, 0);

      const total = folderDocsSize + rootDocsSize;
      return total;
    } catch (error) {
      console.error("Error calculating total storage used:", error);
      return 0;
    }
  };

  const totalUsedBytes = calculateTotalStorageUsed();
  const totalUsedFormatted = formatBytes(totalUsedBytes);
  const storageLimitBytes = 100 * 1024 * 1024; // 100 MB
  const storagePercentage = Math.min(
    (totalUsedBytes / storageLimitBytes) * 100,
    100
  );

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* CHANGED: Pass the file object directly */}
      {previewFile && (
        <FilePreviewDialog
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Files</h3>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Storage Used</span>
            <span className="text-sm text-muted-foreground">
              {totalUsedFormatted} of 100 MB
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Folders</CardTitle>
            {showUploadButton && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" />
                    Add Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <FolderForm
                    type="create"
                    projectId={project.id}
                    onCancel={() => setIsDialogOpen(false)}
                    onSubmitSuccess={() => {
                      setIsDialogOpen(false);
                      fetchProject();
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredFolders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No folders found
            </div>
          ) : (
            filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted "
              >
                <FolderOpen className="h-5 w-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{folder.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {folder.Document?.length || 0}{" "}
                    {(folder.Document?.length || 0) === 1 ? "file" : "files"} •{" "}
                    {folder.Note?.length || 0}{" "}
                    {(folder.Note?.length || 0) === 1 ? "note" : "notes"} •
                    Updated {format(new Date(folder.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/dashboard/projects/folder/${folder.id}`}>
                      <DropdownMenuItem>Open</DropdownMenuItem>
                    </Link>
                    {showEditButton && (
                      <EditFolderDialog
                        folder={folder}
                        fetchProject={fetchProject}
                      />
                    )}
                    {showDeleteButton && (
                      <DeleteDialog
                        id={folder.id}
                        type="Folder"
                        fetchProject={fetchProject}
                      />
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Files */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No files found
            </div>
          ) : (
            filteredFiles.map((file) => {
              const fileType =
                file.originalName.split(".").pop()?.toLowerCase() || "";
              return (
                <div
                  key={file.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted"
                >
                  <FileTypeIcon type={fileType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center space-x-2">
                      <FileTypeBadge type={fileType} />
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(parseSizeToBytes(file.size))} • Uploaded{" "}
                        {format(new Date(file.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleDownload(file.url, file.originalName)
                          }
                        >
                          Download
                        </DropdownMenuItem>
                        {/* CHANGED: Pass the file object */}
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          Preview
                        </DropdownMenuItem>
                        <ShareDialog
                          fileUrl={file.url}
                          itemId={file.id}
                          itemType="file"
                        />
                        {showDeleteButton && (
                          <DeleteDialog
                            id={file.id}
                            type="File"
                            fetchProject={fetchProject}
                          />
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
