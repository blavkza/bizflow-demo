"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  ImageIcon,
  Video,
  Music,
  Calendar,
  Eye,
  ExternalLink,
} from "lucide-react";

// Helper for file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper for URL (Identity function if you don't use Cloudinary transformation)
const formatCloudinaryUrl = (url: string) => url;

interface FilePreviewDialogProps {
  file: any | null; // Accepting any to match your Prisma/DB object structure
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewDialog({
  file,
  isOpen,
  onClose,
}: FilePreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && isOpen) {
      setIsLoading(true);
      setError(null);
    }
  }, [file, isOpen]);

  if (!file) return null;

  const handleDownload = () => {
    if (file.url) window.open(file.url, "_blank");
  };

  // Determine File Type logic based on extension or MIME type
  const fileName = file.originalName || file.name || "";
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const isImage =
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension) ||
    file.type?.startsWith("image/");
  const isVideo =
    ["mp4", "webm", "ogg", "mov"].includes(extension) ||
    file.type?.startsWith("video/");
  const isAudio =
    ["mp3", "wav", "ogg"].includes(extension) ||
    file.type?.startsWith("audio/");
  const isPDF = ["pdf"].includes(extension) || file.type?.includes("pdf");

  const canPreview = isImage || isVideo || isAudio || isPDF;

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-12 w-12 text-blue-500" />;
    if (isVideo) return <Video className="h-12 w-12 text-purple-500" />;
    if (isAudio) return <Music className="h-12 w-12 text-green-500" />;
    if (isPDF) return <FileText className="h-12 w-12 text-red-500" />;
    return <FileText className="h-12 w-12 text-gray-500" />;
  };

  const handlePreviewError = () => {
    setError("Unable to preview this file type");
    setIsLoading(false);
  };

  const handlePreviewLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const openInNewTab = () => {
    if (file.url) {
      window.open(formatCloudinaryUrl(file.url), "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            File Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* File Info Header */}
          <div className="flex items-start justify-between mb-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate" title={fileName}>
                  {fileName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{formatFileSize(file.size || 0)}</span>
                  <span>•</span>
                  <span className="uppercase">{extension}</span>
                  <span>•</span>
                  <span>
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {new Date(
                      file.createdAt || file.uploadedAt
                    ).toLocaleDateString()}
                  </span>
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {file.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Preview Content */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto bg-slate-50 dark:bg-slate-900 rounded-md mt-2">
            {isLoading && canPreview && (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">
                  Loading preview...
                </p>
              </div>
            )}

            {error && (
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">{error}</p>
                <p className="text-sm">
                  This file type cannot be previewed in the browser.
                </p>
              </div>
            )}

            {!canPreview && !error && (
              <div className="text-center text-muted-foreground">
                {getFileIcon()}
                <p className="text-lg font-medium mt-4 mb-2">
                  Preview Not Available
                </p>
                <p className="text-sm">
                  This file type cannot be previewed in the browser.
                  <br />
                  Please download the file to view its contents.
                </p>
              </div>
            )}

            {isImage && canPreview && (
              <div className="max-w-full max-h-full flex items-center justify-center">
                <img
                  src={formatCloudinaryUrl(file.url || "")}
                  alt={fileName}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                  onLoad={handlePreviewLoad}
                  onError={handlePreviewError}
                />
              </div>
            )}

            {isVideo && canPreview && (
              <div className="w-full max-w-2xl">
                <video
                  controls
                  className="w-full max-h-[60vh] rounded-lg shadow-sm"
                  onLoadedData={handlePreviewLoad}
                  onError={handlePreviewError}
                >
                  <source
                    src={formatCloudinaryUrl(file.url || "")}
                    type={file.mimeType || `video/${extension}`}
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {isAudio && canPreview && (
              <div className="w-full max-w-md p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <audio
                  controls
                  className="w-full"
                  onLoadedData={handlePreviewLoad}
                  onError={handlePreviewError}
                >
                  <source
                    src={formatCloudinaryUrl(file.url || "")}
                    type={file.mimeType || `audio/${extension}`}
                  />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}

            {isPDF && canPreview && (
              <div className="w-full h-full min-h-[80vh] flex flex-col">
                <iframe
                  src={`${formatCloudinaryUrl(file.url || "")}#view=FitH`}
                  className="w-full h-full rounded-lg border shadow-sm flex-1"
                  title={fileName}
                  onLoad={handlePreviewLoad}
                  onError={handlePreviewError}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-4 mt-2 border-t gap-2">
            <Button
              variant="outline"
              onClick={openInNewTab}
              disabled={!canPreview}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>

            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
