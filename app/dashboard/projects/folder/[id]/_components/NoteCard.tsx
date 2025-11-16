import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Bookmark,
  Edit3,
  Trash2,
  Tag,
  Calendar,
  Clock,
  Lock,
} from "lucide-react";
import { Note } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePinned: (noteId: string) => void;
  canEditNotes?: boolean;
}

const noteColors = {
  blue: "bg-blue-200 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200",
  green:
    "bg-green-200 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200",
  yellow:
    "bg-yellow-200 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200",
  purple:
    "bg-purple-200 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200",
  pink: "bg-pink-200 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-200",
};

export default function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePinned,
  canEditNotes = false,
}: NoteCardProps) {
  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-2 ${
        noteColors[note.color as keyof typeof noteColors]
      } ${!canEditNotes ? "opacity-90 cursor-default" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {note.pinned && (
                <Bookmark className="h-4 w-4 text-blue-600 fill-blue-600 dark:text-blue-400 dark:fill-blue-400" />
              )}
              <CardTitle className="text-lg">{note.title}</CardTitle>
              {/* View-only indicator */}
              {!canEditNotes && (
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                >
                  <Lock className="h-2.5 w-2.5 mr-1" />
                  View only
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Created {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              {new Date(note.updatedAt) > new Date(note.createdAt) && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions dropdown - only show if user has edit permissions */}
          {canEditNotes && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTogglePinned(note.id)}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  {note.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(note)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
          {note.content}
        </p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs dark:bg-gray-700 dark:text-gray-300"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
