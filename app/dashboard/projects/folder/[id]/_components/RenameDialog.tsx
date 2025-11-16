"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileItem } from "./types";

interface RenameDialogProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export default function RenameDialog({
  file,
  isOpen,
  onClose,
  onRename,
}: RenameDialogProps) {
  const [newFileName, setNewFileName] = useState("");

  useEffect(() => {
    if (file && isOpen) {
      setNewFileName(file.name);
    }
  }, [file, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim() && newFileName !== file?.name) {
      onRename(newFileName.trim());
    }
    onClose();
  };

  const handleClose = () => {
    setNewFileName(file?.name || "");
    onClose();
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="filename">File Name</Label>
            <Input
              id="filename"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter new file name"
              className="mt-1"
              autoFocus
            />
            <p className="text-sm text-muted-foreground mt-2">
              Original: {file.name}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newFileName.trim() || newFileName === file.name}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
