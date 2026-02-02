"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  FileText,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";

interface DocumentUploadProps {
  entityId: string;
  entityType: "loan" | "loanPayment" | "lender";
  onSuccess?: () => void;
  label?: string;
  showList?: boolean;
}

export const DocumentUpload = ({
  entityId,
  entityType,
  onSuccess,
  label = "Upload Documents",
  showList = true,
}: DocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    if (!entityId || !showList) return;
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/documents?entityId=${entityId}&entityType=${entityType}`,
      );
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [entityId, entityType]);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", "OTHER");
        formData.append("entityId", entityId);
        formData.append("entityType", entityType);

        await axios.post("/api/documents", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast.success("Documents uploaded successfully");
      fetchDocuments();
      if (onSuccess) onSuccess();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`/api/documents/${id}`);
      toast.success("Document deleted");
      fetchDocuments();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-4">
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

      {showList && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 border rounded-lg bg-slate-50 min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-medium truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteDocument(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dotted rounded-lg">
              No documents uploaded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
