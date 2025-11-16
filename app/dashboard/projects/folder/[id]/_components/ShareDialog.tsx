"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Link, Check } from "lucide-react";
import { FileItem } from "./types";
import { toast } from "sonner";

interface ShareDialogProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareDialog({
  file,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!file) return null;

  // Generate share link - you can customize this based on your needs
  const shareLink = `${window.location.origin}/shared/${file.id}`;
  // Alternative: Use the direct file URL
  // const shareLink = file.url;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("File link copied to clipboard");

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Share File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" title={file.name}>
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {file.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label htmlFor="share-link" className="text-sm font-medium">
              File Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareLink}
                readOnly
                className="flex-1 text-sm font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                onClick={copyShareLink}
                variant={copied ? "default" : "outline"}
                className={copied ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this link to share the file with others
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(shareLink, "_blank")}
            >
              Open Link
            </Button>
            <Button size="sm" className="flex-1" onClick={copyShareLink}>
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
