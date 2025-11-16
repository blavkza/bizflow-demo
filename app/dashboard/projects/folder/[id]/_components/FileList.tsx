import { FileItem } from "./types";
import FileRow from "./FileRow";

interface FileListProps {
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

export default function FileList({
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
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No files found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <FileRow
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
