"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
  Columns,
  FileText,
  FolderIcon,
  List,
  MessageCircle,
  Users2,
} from "lucide-react";
import { ViewMode } from "../type";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentUserPermission: boolean | null;
  currentUserRole: string | null;
  isManager: boolean;
}

export function ViewModeToggle({
  viewMode,
  setViewMode,
  currentUserPermission,
  currentUserRole,
  isManager,
}: ViewModeToggleProps) {
  const showInvoicesButton =
    currentUserPermission || currentUserRole === "ADMIN" || isManager;

  return (
    <div className="flex items-center gap-1 bg-muted/20 rounded-md p-1">
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("list")}
        className="h-8 px-3"
      >
        <List size={16} />
      </Button>
      <Button
        variant={viewMode === "kanban" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("kanban")}
        className="h-8 px-3"
      >
        <Columns size={16} />
      </Button>
      <Button
        variant={viewMode === "calendar" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("calendar")}
        className="h-8 px-3"
      >
        <Calendar size={16} />
      </Button>
      <Button
        variant={viewMode === "team" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("team")}
        className="h-8 px-3"
      >
        <Users2 size={16} />
      </Button>
      <Button
        variant={viewMode === "files" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("files")}
        className="h-8 px-3"
      >
        <FolderIcon size={16} />
      </Button>
      <Button
        variant={viewMode === "comments" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("comments")}
        className="h-8 px-3"
      >
        <MessageCircle size={16} />
      </Button>
      {showInvoicesButton && (
        <Button
          variant={viewMode === "invoices" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("invoices")}
          className="h-8 px-3"
        >
          <FileText size={16} />
        </Button>
      )}
    </div>
  );
}
