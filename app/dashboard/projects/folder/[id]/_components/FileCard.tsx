import { useState } from "react";
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

interface FileCardProps {
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

export default function FileCard({
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
}: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const canPreview = canPreviewFile(file.type);

  // Checkbox is always visible when selected, otherwise only on hover
  const showCheckbox = isSelected || isHovered;

  return (
    <Card
      className={`group hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 hover:-translate-y-1 cursor-pointer ${
        isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""
      } ${
        !canDeleteFiles && !canRenameFiles && !canShareFiles
          ? "opacity-90 border-gray-200 dark:border-gray-700"
          : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => canPreview && onPreview(file)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(file.id)}
              className={`${showCheckbox ? "opacity-100" : "opacity-0"} transition-opacity`}
            />
            <FileIcon type={file.type} size="lg" />
          </div>
          <div className="flex items-center gap-1">
            {/* Star button - always available */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStar(file.id);
              }}
              className={`${isHovered || isSelected ? "opacity-100" : "opacity-0"} transition-opacity`}
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
                  className={`${isHovered || isSelected ? "opacity-100" : "opacity-0"} transition-opacity`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Preview - always available if file can be previewed */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(file);
                  }}
                  disabled={!canPreview}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                  {!canPreview && (
                    <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                  )}
                </DropdownMenuItem>

                {/* Download - always available */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>

                {/* Share - conditionally available */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onShare(file);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onRename(file);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
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

        <h3
          className="font-semibold text-sm mb-3 truncate group-hover:text-blue-600 transition-colors"
          title={file.name}
        >
          {file.name}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(file.size)}</span>
            <span>{new Date(file.lastModified).toLocaleDateString()}</span>
          </div>

          {file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {file.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
              {file.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{file.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {file.shared && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            )}
            {file.starred && (
              <Badge variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                Starred
              </Badge>
            )}
            {canPreview && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Badge>
            )}
            {isSelected && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700"
              >
                Selected
              </Badge>
            )}
            {/* Permission indicator badge */}
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
        </div>
      </CardContent>
    </Card>
  );
}
