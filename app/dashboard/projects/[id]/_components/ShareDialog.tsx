"use client";

import { Copy, Link as LinkIcon, Mail } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareDropdownItemProps {
  itemId: string;
  itemType: string;
  basePath?: string;
  fileUrl?: string;
}

export function ShareDialog({
  itemId,
  itemType,
  basePath = "/dashboard/projects",
  fileUrl,
}: ShareDropdownItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareLink =
    itemType === "file"
      ? fileUrl || `${window.location.origin}${basePath}/file/${itemId}`
      : `${window.location.origin}${basePath}/${itemType}/${itemId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
        >
          Share
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share {itemType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={shareLink} readOnly className="flex-1" />
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyLink}
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyLink}
            >
              <LinkIcon className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
