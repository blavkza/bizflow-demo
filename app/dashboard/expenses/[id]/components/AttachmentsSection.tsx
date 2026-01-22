"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Expense, Attachment } from "../types";
import {
  Paperclip,
  Eye,
  EyeOff,
  X,
  Loader2,
  ImageIcon,
  FileText,
  Download,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Image from "next/image";

interface AttachmentsSectionProps {
  expense: Expense;
  onRefresh: () => void;
}

export default function AttachmentsSection({
  expense,
  onRefresh,
}: AttachmentsSectionProps) {
  const [showAttachments, setShowAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null
  );
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);

  const attachments: Attachment[] = expense.attachments || [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("expenseId", expense.id);

      const uploadResponse = await axios.post(
        "/api/expenses/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const attachmentData = uploadResponse.data;

      await axios.post(`/api/expenses/${expense.id}/attachments`, {
        attachment: attachmentData,
      });

      toast.success("Attachment uploaded successfully");
      setSelectedFile(null);
      setAttachmentPreview(null);
      onRefresh();
    } catch (error: any) {
      console.error("Error uploading attachment:", error);
      toast.error(error.response?.data?.error || "Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      setDeletingAttachmentId(attachmentId);
      await axios.delete(
        `/api/expenses/${expense.id}/attachments?attachmentId=${attachmentId}`
      );
      toast.success("Attachment deleted successfully");
      onRefresh();
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      toast.error(error.response?.data?.error || "Failed to delete attachment");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <ImageIcon className="h-4 w-4" />;
      case "PDF":
        return <FileText className="h-4 w-4" />;
      case "DOCUMENT":
        return <FileText className="h-4 w-4" />;
      default:
        return <Paperclip className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>
              Manage expense-related documents and images ({attachments.length}{" "}
              files)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttachments(!showAttachments)}
          >
            {showAttachments ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showAttachments ? "Hide" : "Show"} Attachments
          </Button>
        </div>
      </CardHeader>

      {showAttachments && (
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="attachment-upload"
            />
            <Label
              htmlFor="attachment-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              <Paperclip className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">Click to upload files</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </Label>

            {/* File Preview */}
            {attachmentPreview && selectedFile && (
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {getFileIcon("IMAGE")}
                    <span className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setAttachmentPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative inline-block">
                  <Image
                    src={attachmentPreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="max-h-48 rounded-lg border shadow-sm object-contain"
                  />
                </div>
                <Button
                  onClick={handleUploadAttachment}
                  disabled={isUploading}
                  className="mt-4 w-full"
                  size="lg"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Paperclip className="h-4 w-4 mr-2" />
                  )}
                  Upload Attachment
                </Button>
              </div>
            )}
          </div>

          {/* Existing Attachments */}
          {attachments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(attachment.type)}
                      <span className="text-sm font-medium truncate">
                        {attachment.filename}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      disabled={deletingAttachmentId === attachment.id}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      title="Delete attachment"
                    >
                      {deletingAttachmentId === attachment.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  {attachment.type === "IMAGE" && (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden border">
                      <div className="relative w-full h-48 overflow-hidden rounded-lg">
                        <Image
                          src={attachment.url}
                          alt={attachment.filename || "Attachment"}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>
                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href={attachment.url} download>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Paperclip className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No attachments yet</p>
              <p className="text-sm mt-1">
                Upload your first file to get started
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
