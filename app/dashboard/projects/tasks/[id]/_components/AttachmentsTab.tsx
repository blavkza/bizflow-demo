"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Trash2,
  Upload,
  File,
  FileImage,
  FileCode,
  MoreVertical,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Types based on Prisma Document model
interface Document {
  id: string;
  name: string;
  url: string;
  size: number; // in bytes
  type: string; // MIME type or extension
  createdAt: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface Task {
  id: string;
  documents: Document[];
}

interface AttachmentsTabProps {
  task: Task;
  refetch: () => void;
}

export default function AttachmentsTab({ task, refetch }: AttachmentsTabProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper to get icon based on file type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
        return <FileText className="h-8 w-8 text-blue-500" />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return <FileImage className="h-8 w-8 text-purple-500" />;
      case "js":
      case "ts":
      case "tsx":
      case "css":
        return <FileCode className="h-8 w-8 text-yellow-500" />;
      default:
        return <File className="h-8 w-8 text-gray-400" />;
    }
  };

  const handleUpload = () => {
    // Placeholder for upload logic
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Files & Documents</h3>
          <p className="text-sm text-muted-foreground">
            Manage assets and documents related to this task.
          </p>
        </div>
        <Button onClick={handleUpload} disabled={isUploading}>
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Upload Drop Zone (Visual only) */}
        <div className="col-span-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Paperclip className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-sm font-semibold">
            Click or drag file to this area to upload
          </h4>
          <p className="text-xs text-muted-foreground mt-2">
            Support for PDF, PNG, JPG, and DOCX files up to 50MB
          </p>
        </div>

        {/* File List */}
        {task.documents && task.documents.length > 0 ? (
          task.documents.map((doc) => (
            <Card
              key={doc.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="mt-1 bg-muted p-2 rounded-md">
                      {getFileIcon(doc.name)}
                    </div>
                    <div className="space-y-1">
                      <p
                        className="font-medium text-sm line-clamp-1"
                        title={doc.name}
                      >
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      {doc.uploadedBy && (
                        <p className="text-xs text-muted-foreground">
                          by {doc.uploadedBy.firstName}
                        </p>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a
                          href={doc.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="cursor-pointer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No documents attached yet.
          </div>
        )}
      </div>
    </div>
  );
}
