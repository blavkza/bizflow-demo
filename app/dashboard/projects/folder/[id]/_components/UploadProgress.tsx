"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import { FileItem } from "./types";
import { useState, useEffect } from "react";

interface UploadProgressProps {
  uploadingFiles: FileItem[];
}

interface UploadProgressFile extends FileItem {
  uploadProgress: number;
  status: "uploading" | "completed" | "error";
}

export default function UploadProgress({
  uploadingFiles,
}: UploadProgressProps) {
  const [filesWithProgress, setFilesWithProgress] = useState<
    UploadProgressFile[]
  >([]);

  // Sync with parent component's uploadingFiles
  useEffect(() => {
    setFilesWithProgress((prev) => {
      const currentIds = new Set(uploadingFiles.map((f) => f.id));

      // Remove files that are no longer uploading
      const filtered = prev.filter((file) => currentIds.has(file.id));

      // Add new files
      const newFiles = uploadingFiles
        .filter((file) => !prev.some((f) => f.id === file.id))
        .map((file) => ({
          ...file,
          uploadProgress: file.uploadProgress || 0,
          status: "uploading" as const,
        }));

      return [...filtered, ...newFiles];
    });
  }, [uploadingFiles]);

  if (filesWithProgress.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Uploading Files (
          {filesWithProgress.filter((f) => f.status === "uploading").length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filesWithProgress.map((file) => (
          <div key={file.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate flex items-center gap-2">
                {file.name}
                {file.status === "completed" && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Completed
                  </span>
                )}
                {file.status === "error" && (
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    Failed
                  </span>
                )}
              </span>
              <span className="text-gray-500">{file.uploadProgress}%</span>
            </div>
            <Progress
              value={file.uploadProgress}
              className={`h-2 ${
                file.status === "completed"
                  ? "bg-green-100"
                  : file.status === "error"
                    ? "bg-red-100"
                    : ""
              }`}
            />
            {file.status === "error" && (
              <p className="text-xs text-red-600">
                Upload failed. Please try again.
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
