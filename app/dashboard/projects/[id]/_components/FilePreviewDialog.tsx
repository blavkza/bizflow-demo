"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import Image from "next/image";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FilePreviewDialogProps {
  fileUrl: string;
  fileType: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewDialog({
  fileUrl,
  fileType,
  isOpen,
  onClose,
}: FilePreviewDialogProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const normalizedFileType = fileType.toLowerCase();

  const handleDownload = () => {
    if (!fileUrl) return;

    window.open(fileUrl, "_blank");
  };

  // Supported file types for preview
  const supportedTypes = {
    pdf: ["pdf"],
    images: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
    documents: ["doc", "docx", "xls", "xlsx", "ppt", "pptx"],
    text: ["txt", "csv", "json", "xml"],
    code: ["js", "ts", "html", "css", "py", "java", "cpp", "c", "php"],
  };

  const canPreview = [
    ...supportedTypes.pdf,
    ...supportedTypes.images,
    ...supportedTypes.documents,
    ...supportedTypes.text,
    ...supportedTypes.code,
  ].includes(normalizedFileType);

  const renderContent = () => {
    if (!canPreview) {
      return (
        <div className="p-4 text-center">
          <p>Preview not available for .{fileType} files</p>
          <Button onClick={handleDownload} className="mt-4 gap-2">
            <Download className="h-4 w-4" />
            Download File
          </Button>
        </div>
      );
    }

    // PDF Preview
    if (supportedTypes.pdf.includes(normalizedFileType)) {
      return (
        <>
          <div className="relative h-[80vh]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setIsLoading(false);
              }}
              loading={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={800}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
          {numPages && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p>
                Page {pageNumber} of {numPages}
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  setPageNumber((prev) => Math.min(prev + 1, numPages))
                }
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      );
    }

    // Image Preview
    if (supportedTypes.images.includes(normalizedFileType)) {
      return (
        <div className="relative h-[80vh] flex items-center justify-center">
          <div className="max-h-full max-w-full">
            <Image
              src={fileUrl}
              alt="Preview"
              className="object-contain max-h-[75vh]"
              fill
              onLoadingComplete={() => setIsLoading(false)}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </div>
      );
    }

    // For other previewable types, use Google Docs Viewer
    return (
      <div className="relative h-[80vh] w-full">
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        {renderContent()}
        {canPreview && (
          <Button
            onClick={handleDownload}
            className="absolute bottom-6 right-6"
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
