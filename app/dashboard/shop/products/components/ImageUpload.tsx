"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadedFile } from "@/types/product";

interface ImageUploadProps {
  onFileUpload: (file: UploadedFile) => void;
  onFileRemove: (url: string) => void;
  existingFiles?: UploadedFile[];
  allowedTypes?: ("IMAGE" | "PDF" | "DOCUMENT" | "OTHER")[];
  multiple?: boolean;
}

export function ImageUpload({
  onFileUpload,
  onFileRemove,
  existingFiles = [],
  allowedTypes = ["IMAGE", "PDF", "DOCUMENT", "OTHER"],
  multiple = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    const accept = [];
    if (allowedTypes.includes("IMAGE")) accept.push("image/*");
    if (allowedTypes.includes("PDF")) accept.push(".pdf");
    if (allowedTypes.includes("DOCUMENT")) {
      accept.push(".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt");
    }
    return accept.join(",");
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      await uploadFile(file);

      if (!multiple) break;
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/shop/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const uploadedFile: UploadedFile = {
        url: data.url,
        name: file.name,
        type: data.type || "OTHER", // Fallback to 'OTHER' if type is undefined
        size: file.size,
        mimeType: file.type,
      };

      setFiles((prev) => [...prev, uploadedFile]);
      onFileUpload(uploadedFile);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (fileUrl: string) => {
    setFiles((prev) => prev.filter((file) => file.url !== fileUrl));
    onFileRemove(fileUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      for (let i = 0; i < droppedFiles.length; i++) {
        uploadFile(droppedFiles[i]);
        if (!multiple) break;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <Image className="h-4 w-4" />;
      case "PDF":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeDisplay = (type: string | undefined) => {
    if (!type) return "other";
    return type.toLowerCase();
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={getAcceptString()}
          multiple={multiple}
          className="hidden"
        />

        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or click to select
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Uploading..." : "Select Files"}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          {allowedTypes.includes("IMAGE") &&
            "Images (PNG, JPG, GIF up to 5MB), "}
          {allowedTypes.includes("PDF") && "PDFs (up to 10MB), "}
          {allowedTypes.includes("DOCUMENT") &&
            "Documents (DOC, XLS, PPT up to 10MB)"}
        </p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {file.type === "IMAGE" ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeDisplay(file.type)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full"
                    onClick={() => removeFile(file.url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
