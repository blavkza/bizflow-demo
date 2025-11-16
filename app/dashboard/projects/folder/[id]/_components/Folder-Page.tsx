"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Edit3 } from "lucide-react";
import { FolderData, FileItem, Note } from "./types";
import FolderHeader from "./FolderHeader";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import NotesTab from "./NotesTab";
import FolderStats from "./FolderStats";
import RecentActivity from "./RecentActivity";
import SearchAndFilters from "./SearchAndFilters";
import BulkActions from "./BulkActions";
import UploadProgress from "./UploadProgress";
import DownloadProgress from "./DownloadProgress";
import { toast } from "sonner";
import PreviewDialog from "./PreviewDialog";
import RenameDialog from "./RenameDialog";
import ShareDialog from "./ShareDialog";
import Loading from "./FolderPageSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

interface FolderPageProps {
  folderId: string;
}

export default function FolderPage({ folderId }: FolderPageProps) {
  const { userId } = useAuth();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<FileItem[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">(
    "date"
  );
  const [filterBy, setFilterBy] = useState<
    "all" | "starred" | "shared" | "recent"
  >("all");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [sharingFile, setSharingFile] = useState<FileItem | null>(null);

  async function fetchUserData(userId: string) {
    const response = await fetch(`/api/users/userId/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json();
  }

  const fetchFolderData = async (): Promise<FolderData> => {
    const response = await fetch(`/api/folders/${folderId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch folder data");
    }
    const data = await response.json();

    // Ensure documents and notes arrays exist
    return {
      ...data,
      documents: data.documents || [],
      notes: data.notes || [],
    };
  };

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
    data: folderData,
    isLoading: loadingFolder,
    error: folderError,
    refetch,
  } = useQuery({
    queryKey: ["SingleFolder", folderId],
    queryFn: fetchFolderData,
    refetchInterval: 10000,
  });

  const currentUserId = user?.id;
  const managerId = folderData?.Project?.managerId;
  const isManager =
    currentUserId === managerId ||
    user?.role === UserRole.CHIEF_EXECUTIVE_OFFICER;

  const currentMember = folderData?.Project?.teamMembers?.find(
    (member) => member.userId === currentUserId
  );

  const currentUserRole = currentMember?.role || null;

  const currentUserPermissions = {
    canEditTask: isManager || currentMember?.canEditTask || false,
    canDeleteTask: isManager || currentMember?.canDeleteTask || false,
    canDeleteFiles: isManager || currentMember?.canDeleteFiles || false,
    canCreateTask: isManager || currentMember?.canCreateTask || false,
    canAddInvoice: isManager || currentMember?.canAddInvoice || false,
    canUploadFiles: isManager || currentMember?.canUploadFiles || false,
    canEditFile: isManager || currentMember?.canEditFile || false,
    canViewFinancial: isManager || currentMember?.canViewFinancial || false,
    canAddWorkLog: isManager || (currentMember?.canAddWorkLog ?? true),
    canRenameFiles: isManager || currentMember?.canEditFile || false,
    canShareFiles: isManager || currentMember?.canEditFile || false,
  };

  const handleShare = async (file: FileItem) => {
    if (!currentUserPermissions.canShareFiles) {
      toast.error("You don't have permission to share files");
      return;
    }

    try {
      const response = await fetch(`/api/documents/${file.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shared: !file.shared }),
      });

      if (!response.ok) {
        throw new Error("Failed to update share status");
      }

      await refetch();
      toast.success(
        `${file.name} is now ${!file.shared ? "shared" : "private"}`
      );
    } catch (error) {
      console.error("Error sharing file:", error);
      toast.error("Failed to update share status");
    }
  };

  const handleRename = (file: FileItem) => {
    if (!currentUserPermissions.canRenameFiles) {
      toast.error("You don't have permission to rename files");
      return;
    }
    setRenamingFile(file);
  };

  const handleRenameSubmit = async (newFileName: string) => {
    if (!renamingFile || !newFileName.trim()) return;

    if (!currentUserPermissions.canRenameFiles) {
      toast.error("You don't have permission to rename files");
      return;
    }

    try {
      const response = await fetch(`/api/documents/${renamingFile.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newFileName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename file");
      }

      await refetch();
      setRenamingFile(null);
      toast.success("File renamed successfully");
    } catch (error) {
      console.error("Error renaming file:", error);
      toast.error("Failed to rename file");
    }
  };

  const handleCancelRename = () => {
    setRenamingFile(null);
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/documents/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error("Failed to download file");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!currentUserPermissions.canUploadFiles) {
      toast.error("You don't have permission to upload files");
      return;
    }

    files.forEach(async (file, index) => {
      const newFile: FileItem = {
        id: `upload-${Date.now()}-${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        lastModified: new Date(),
        tags: [],
        starred: false,
        shared: false,
        uploadProgress: 0,
        mimeType: file.type,
      };

      setUploadingFiles((prev) => [...prev, newFile]);

      // Simulate progress for larger files
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 10;
          if (progress >= 90) {
            clearInterval(interval);
          }
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? { ...f, uploadProgress: Math.min(progress, 90) }
                : f
            )
          );
        }, 200);
        return interval;
      };

      const progressInterval = simulateProgress();

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", "OTHER");

        const response = await fetch(`/api/folders/${folderId}/documents`, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        // Set to 100% complete
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id ? { ...f, uploadProgress: 100 } : f
          )
        );

        await response.json();

        // Wait a moment to show completion, then refetch and remove
        setTimeout(async () => {
          await refetch();
          setUploadingFiles((prev) => prev.filter((f) => f.id !== newFile.id));
          toast.success(`${file.name} uploaded successfully`);
        }, 1000);
      } catch (error) {
        console.error("Upload error:", error);
        clearInterval(progressInterval);

        // Mark as error
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? { ...f, uploadProgress: 100, status: "error" }
              : f
          )
        );

        // Remove error after a delay
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== newFile.id));
        }, 3000);

        toast.error(`Failed to upload ${file.name}`);
      }
    });
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleFileStar = async (fileId: string) => {
    try {
      const file = folderData?.documents?.find((f) => f.id === fileId);
      if (!file) return;

      const response = await fetch(`/api/documents/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ starred: !file.starred }),
      });

      if (!response.ok) {
        throw new Error("Failed to update file");
      }

      await refetch();
    } catch (error) {
      console.error("Error updating file:", error);
      toast.error("Failed to update file");
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!currentUserPermissions.canDeleteFiles) {
      toast.error("You don't have permission to delete files");
      return;
    }

    try {
      const response = await fetch(`/api/documents/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      await refetch();
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const deleteSelectedFiles = async () => {
    if (!currentUserPermissions.canDeleteFiles) {
      toast.error("You don't have permission to delete files");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("No files selected");
      return;
    }

    try {
      await Promise.all(
        selectedFiles.map((fileId) =>
          fetch(`/api/documents/${fileId}`, { method: "DELETE" })
        )
      );

      await refetch();
      setSelectedFiles([]);
      toast.success("Files deleted successfully");
    } catch (error) {
      console.error("Error deleting files:", error);
      toast.error("Failed to delete files");
    }
  };

  const downloadAllFiles = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          const link = document.createElement("a");
          link.href = "#";
          link.download = `${folderData?.title?.replace(/\s+/g, "_")}_files.zip`;
          link.click();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Use React Query loading state directly
  if (loadingFolder) {
    return <Loading />;
  }

  if (!folderData) {
    return (
      <div className="flex items-center justify-center p-8">
        Folder not found
      </div>
    );
  }

  // Safe filtering with fallbacks
  const filteredFiles = (folderData.documents || [])
    .filter((file) => {
      const matchesSearch =
        file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      switch (filterBy) {
        case "starred":
          return matchesSearch && file.starred;
        case "shared":
          return matchesSearch && file.shared;
        case "recent":
          return (
            matchesSearch &&
            new Date().getTime() - new Date(file.lastModified).getTime() <
              7 * 24 * 60 * 60 * 1000
          );
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "size":
          return (b.size || 0) - (a.size || 0);
        case "type":
          return (a.type || "").localeCompare(b.type || "");
        case "date":
        default:
          return (
            new Date(b.lastModified).getTime() -
            new Date(a.lastModified).getTime()
          );
      }
    });

  const sortedNotes = [...(folderData.notes || [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="p-4">
      <FolderHeader
        folderData={folderData}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFileUpload={handleFileUpload}
        canUploadFiles={currentUserPermissions.canUploadFiles}
        userRole={currentUserRole}
        isManager={isManager}
        refetch={refetch}
      />

      <div className="py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Tabs defaultValue="files" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger
                    value="files"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Files ({(folderData.documents || []).length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Notes ({(folderData.notes || []).length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="files" className="space-y-6">
                <UploadProgress uploadingFiles={uploadingFiles} />
                <DownloadProgress
                  isDownloading={isDownloading}
                  downloadProgress={downloadProgress}
                />

                <SearchAndFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  filterBy={filterBy}
                  onFilterChange={setFilterBy}
                  onFileUpload={handleFileUpload}
                />

                {selectedFiles.length > 0 && (
                  <BulkActions
                    selectedFiles={selectedFiles}
                    onDeleteSelected={deleteSelectedFiles}
                    onDownloadAll={downloadAllFiles}
                    canDeleteFiles={currentUserPermissions.canDeleteFiles}
                  />
                )}

                {viewMode === "grid" ? (
                  <FileGrid
                    files={filteredFiles}
                    selectedFiles={selectedFiles}
                    onFileSelect={toggleFileSelection}
                    onFileStar={toggleFileStar}
                    onFileDelete={deleteFile}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    onRename={handleRename}
                    canDeleteFiles={currentUserPermissions.canDeleteFiles}
                    canRenameFiles={currentUserPermissions.canRenameFiles}
                    canShareFiles={currentUserPermissions.canShareFiles}
                  />
                ) : (
                  <FileList
                    files={filteredFiles}
                    selectedFiles={selectedFiles}
                    onFileSelect={toggleFileSelection}
                    onFileStar={toggleFileStar}
                    onFileDelete={deleteFile}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    onRename={handleRename}
                    canDeleteFiles={currentUserPermissions.canDeleteFiles}
                    canRenameFiles={currentUserPermissions.canRenameFiles}
                    canShareFiles={currentUserPermissions.canShareFiles}
                  />
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                <NotesTab
                  notes={sortedNotes}
                  folderId={folderId}
                  onNotesUpdate={refetch}
                  canEditNotes={currentUserPermissions.canEditFile}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <FolderStats
              documents={folderData.documents || []}
              notes={folderData.notes || []}
            />
            <RecentActivity documents={folderData.documents || []} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PreviewDialog
        file={previewFile}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
        onDownload={handleDownload}
      />

      <RenameDialog
        file={renamingFile}
        isOpen={!!renamingFile}
        onClose={handleCancelRename}
        onRename={handleRenameSubmit}
      />

      <ShareDialog
        file={sharingFile}
        isOpen={!!sharingFile}
        onClose={() => setSharingFile(null)}
      />
    </div>
  );
}
