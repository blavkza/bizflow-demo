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
  Wrench,
  CreditCard,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  const showToolsButton = currentUserRole === "ADMIN" || isManager;

  const showExpensesButton =
    currentUserPermission || currentUserRole === "ADMIN" || isManager;

  const showWorkLogsButton =
    currentUserRole === "ADMIN" || isManager || currentUserPermission;

  const viewModes = [
    {
      mode: "list" as ViewMode,
      icon: List,
      label: "List View",
      show: true,
    },
    {
      mode: "kanban" as ViewMode,
      icon: Columns,
      label: "Kanban Board",
      show: true,
    },
    {
      mode: "calendar" as ViewMode,
      icon: Calendar,
      label: "Calendar View",
      show: true,
    },
    {
      mode: "team" as ViewMode,
      icon: Users2,
      label: "Team Members",
      show: true,
    },
    {
      mode: "files" as ViewMode,
      icon: FolderIcon,
      label: "Files & Documents",
      show: true,
    },
    {
      mode: "comments" as ViewMode,
      icon: MessageCircle,
      label: "Comments & Discussions",
      show: true,
    },
    {
      mode: "tools" as ViewMode,
      icon: Wrench,
      label: "Tools & Equipment",
      show: showToolsButton,
    },
    {
      mode: "expenses" as ViewMode,
      icon: CreditCard,
      label: "Expenses",
      show: showExpensesButton,
    },
    {
      mode: "invoices" as ViewMode,
      icon: FileText,
      label: "Invoices",
      show: showInvoicesButton,
    },
    {
      mode: "worklogs" as ViewMode,
      icon: Clock,
      label: "Work Logs",
      show: showWorkLogsButton,
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-muted/20 rounded-md p-1">
        {viewModes.map(({ mode, icon: Icon, label, show }) => {
          if (!show) return null;

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className="h-8 px-3"
                >
                  <Icon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
