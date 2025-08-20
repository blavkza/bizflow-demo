import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { File, FolderOpen, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Project } from "../type";

interface UploadFileDialogProps {
  project: Project;
  fetchProject: () => void;
}

export default function UploadFileDialog({
  project,
  fetchProject,
}: UploadFileDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState("OTHER");
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", documentType);
      formData.append("entityType", folderId ? "folder" : "project");
      formData.append("entityId", folderId ? folderId : project.id);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      await response.json();
      toast.success("Document uploaded successfully");
      await fetchProject();
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setFolderId(undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a File for ({project.title})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="documentType" className="text-right">
              Document Type
            </Label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INVOICE">Invoice</SelectItem>
                <SelectItem value="RECEIPT">Receipt</SelectItem>
                <SelectItem value="ID_COPY">ID Copy</SelectItem>
                <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                <SelectItem value="TAX_DOCUMENT">Tax Document</SelectItem>
                <SelectItem value="PAYSLIP">Payslip</SelectItem>
                <SelectItem value="LEAVE_FORM">Leave Form</SelectItem>
                <SelectItem value="PERFORMANCE_REVIEW">
                  Performance Review
                </SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {project.Folder && project.Folder.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="folder"
                className="text-right flex items-center gap-2 ml-auto"
              >
                Folder (Optional) <FolderOpen className="text-blue-600" />
              </Label>
              <Select
                value={folderId}
                onValueChange={(val) =>
                  setFolderId(val === "none" ? undefined : val)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="No folder selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder Selected</SelectItem>
                  {project.Folder.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="file"
              className="text-right flex items-center gap-2 ml-auto"
            >
              File / Document
              <File className="text-yellow-600" />
            </Label>
            <div className="col-span-3">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Selected: {selectedFile.name} (
                  {Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
