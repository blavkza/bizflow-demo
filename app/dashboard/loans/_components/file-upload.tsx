"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

interface FileUploadProps {
  onFilesUploaded: (files: any[]) => void;
  label?: string;
  value?: any[];
}

export const FileUpload = ({
  onFilesUploaded,
  label = "Upload Files",
  value = [],
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      const uploadedFiles = [...value];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        // Using the existing expense upload endpoint which only handles Cloudinary
        const response = await axios.post("/api/expenses/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedFiles.push(response.data);
      }

      onFilesUploaded(uploadedFiles);
      toast.success("Files uploaded successfully");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onFilesUploaded(newFiles);
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={onFileSelect}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-dashed"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {label}
      </Button>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-md bg-slate-50 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="h-6 w-6 rounded bg-green-100 flex items-center justify-center shrink-0">
                  <FileText className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="truncate py-1">
                  {file.filename || file.name}
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto bg-green-50 text-green-700 border-green-200 text-[10px] h-4 px-1 shrink-0"
                >
                  Uploaded
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
