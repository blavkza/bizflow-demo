import { FileItem } from "./types";
import FileCard from "./FileCard";

interface FileGridProps {
  files: FileItem[];
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
  onFileStar: (fileId: string) => void;
  onFileDelete: (fileId: string) => void;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  canDeleteFiles?: boolean;
  canRenameFiles?: boolean;
  canShareFiles?: boolean;
}

export default function FileGrid({
  files,
  selectedFiles,
  onFileSelect,
  onFileStar,
  onFileDelete,
  onPreview,
  onDownload,
  onShare,
  onRename,
  canDeleteFiles = false,
  canRenameFiles = false,
  canShareFiles = false,
}: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-lg dark:bg-gray-900">
        <p className="text-muted-foreground">No files found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          isSelected={selectedFiles.includes(file.id)}
          onSelect={onFileSelect}
          onStar={onFileStar}
          onDelete={onFileDelete}
          onPreview={onPreview}
          onDownload={onDownload}
          onShare={onShare}
          onRename={onRename}
          canDeleteFiles={canDeleteFiles}
          canRenameFiles={canRenameFiles}
          canShareFiles={canShareFiles}
        />
      ))}
    </div>
  );
}
