import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  MoreVertical,
  Users,
  Eye,
  Download,
  Share2,
  Edit3,
  Trash2,
  Lock,
} from "lucide-react";
import { FileItem } from "./types";
import { formatFileSize, canPreviewFile } from "../utils";
import FileIcon from "./FileIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FileRowProps {
  file: FileItem;
  isSelected: boolean;
  onSelect: (fileId: string) => void;
  onStar: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  canDeleteFiles?: boolean;
  canRenameFiles?: boolean;
  canShareFiles?: boolean;
}

export default function FileRow({
  file,
  isSelected,
  onSelect,
  onStar,
  onDelete,
  onPreview,
  onDownload,
  onShare,
  onRename,
  canDeleteFiles = false,
  canRenameFiles = false,
  canShareFiles = false,
}: FileRowProps) {
  const canPreview = canPreviewFile(file.type);

  return (
    <Card
      className={`
        ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
        ${!canDeleteFiles && !canRenameFiles && !canShareFiles ? "border-gray-200 dark:border-gray-700" : ""}
      `}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(file.id)}
              className={`${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
            />
            <FileIcon type={file.type} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={() => canPreview && onPreview(file)}
                >
                  {file.name}
                </h3>
                {/* Permission indicator for view-only users */}
                {(!canDeleteFiles || !canRenameFiles || !canShareFiles) && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                  >
                    <Lock className="h-2.5 w-2.5 mr-1" />
                    View only
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(file.lastModified).toLocaleDateString()}
                </span>
                {file.tags.length > 0 && (
                  <div className="flex gap-1">
                    {file.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {file.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{file.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* File status icons */}
            {file.starred && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            )}
            {file.shared && <Users className="h-4 w-4 text-blue-500" />}
            {isSelected && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700"
              >
                Selected
              </Badge>
            )}

            {/* Star button - always available */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStar(file.id)}
              className={`${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
            >
              <Star
                className={`h-4 w-4 ${file.starred ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
            </Button>

            {/* Actions dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Preview - always available if file can be previewed */}
                <DropdownMenuItem
                  onClick={() => onPreview(file)}
                  disabled={!canPreview}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                  {!canPreview && (
                    <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                  )}
                </DropdownMenuItem>

                {/* Download - always available */}
                <DropdownMenuItem onClick={() => onDownload(file)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>

                {/* Share - conditionally available */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          onClick={() => onShare(file)}
                          disabled={!canShareFiles}
                          className={
                            !canShareFiles ? "text-muted-foreground" : ""
                          }
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                          {!canShareFiles && (
                            <Lock className="h-3 w-3 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {!canShareFiles && (
                      <TooltipContent side="right">
                        <p>You don't have permission to share files</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenuSeparator />

                {/* Rename - conditionally available */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          onClick={() => onRename(file)}
                          disabled={!canRenameFiles}
                          className={
                            !canRenameFiles ? "text-muted-foreground" : ""
                          }
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Rename
                          {!canRenameFiles && (
                            <Lock className="h-3 w-3 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {!canRenameFiles && (
                      <TooltipContent side="right">
                        <p>You don't have permission to rename files</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Delete - conditionally available */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          className={`${canDeleteFiles ? "text-red-600" : "text-muted-foreground"}`}
                          onClick={() => {
                            if (canDeleteFiles) {
                              onDelete(file.id);
                            }
                          }}
                          disabled={!canDeleteFiles}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                          {!canDeleteFiles && (
                            <Lock className="h-3 w-3 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {!canDeleteFiles && (
                      <TooltipContent side="right">
                        <p>You don't have permission to delete files</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
