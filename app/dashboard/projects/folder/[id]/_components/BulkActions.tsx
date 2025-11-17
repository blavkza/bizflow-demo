import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Trash2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BulkActionsProps {
  selectedFiles: string[];
  onDeleteSelected: () => void;
  onDownloadAll: () => void;
  canDeleteFiles?: boolean;
  canDownloadFiles?: boolean;
  canShareFiles?: boolean;
}

export default function BulkActions({
  selectedFiles,
  onDeleteSelected,
  onDownloadAll,
  canDeleteFiles = false,
  canDownloadFiles = true,
  canShareFiles = false,
}: BulkActionsProps) {
  if (selectedFiles.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}{" "}
              selected
            </span>

            {/* Permission indicator */}
            {!canDeleteFiles && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                <span>Limited actions available</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {/* Download Button - Conditionally enabled */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDownloadAll}
                      disabled={!canDownloadFiles || selectedFiles.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canDownloadFiles && (
                  <TooltipContent>
                    <p>You don't have permission to download files</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Share Button - Conditionally enabled */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canShareFiles || selectedFiles.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canShareFiles && (
                  <TooltipContent>
                    <p>You don't have permission to share files</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Delete Button - Conditionally enabled with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={onDeleteSelected}
                      disabled={!canDeleteFiles || selectedFiles.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canDeleteFiles && (
                  <TooltipContent>
                    <p>You don't have permission to delete files</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Additional info for limited permissions */}
        {!canDeleteFiles && selectedFiles.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            You can select files, but deletion requires higher permissions
          </div>
        )}
      </CardContent>
    </Card>
  );
}
