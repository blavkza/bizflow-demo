"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  FileText,
  Eye,
  Download,
  Trash,
  Loader2,
  Menu,
  EllipsisVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Client } from "@prisma/client";

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  createdAt: Date;
}

interface DocumentsTabProps {
  client: Client & {
    documents?: Document[];
  };
  fetchDocuments: () => Promise<void>;
}

export function DocumentsTab({ client, fetchDocuments }: DocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("CONTRACT");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      formData.append("entityType", "client");
      formData.append("entityId", client.id);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      toast.success("Document uploaded successfully");
      await fetchDocuments();
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setIsDeleting(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      toast.success("Document deleted successfully");
      await fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-80"
            />
          </div>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a document for {client.name}
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
                    <SelectItem value="BANK_STATEMENT">
                      Bank Statement
                    </SelectItem>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  File
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
      </div>

      <Card>
        {client.documents?.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No documents uploaded
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload contracts, agreements, and other important documents for
              this client.
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload First Document
            </Button>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.documents
                ?.filter(
                  (doc) =>
                    doc.originalName
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.originalName || doc.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {doc.size ? `${Math.round(doc.size / 1024)} KB` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <EllipsisVertical className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                                view
                              </a>
                            </Button>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.url} target="_blank" download>
                                <Download className="h-4 w-4" />
                                download
                              </a>
                            </Button>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {" "}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={isDeleting === doc.id}
                            >
                              {isDeleting === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash className="h-4 w-4 text-red-500" />
                                  delete
                                </>
                              )}
                            </Button>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
