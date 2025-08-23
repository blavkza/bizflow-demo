"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, Folder, FolderOpen, FileText, List } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Folder as FolderType } from "@/types/sidebar";
import { isActive } from "./utils/sidebar-helpers";

interface FolderItemProps {
  folder: FolderType;
  project: any;
  pathname: string;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  project,
  pathname,
  expandedFolders,
  onToggleFolder,
}) => {
  return (
    <Collapsible
      key={folder.id}
      open={expandedFolders.has(folder.id)}
      onOpenChange={() => onToggleFolder(folder.id)}
    >
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          asChild
          className={clsx(
            "w-full hover:bg-accent/50",
            isActive(
              pathname,
              `/dashboard/projects/${project.id}/folders/${folder.id}`
            ) && "bg-accent/90 hover:bg-accent "
          )}
        >
          <div>
            {expandedFolders.has(folder.id) ? (
              <FolderOpen className={clsx("mr-2 h-4 w-4")} />
            ) : (
              <Folder className={clsx("mr-2 h-4 w-4")} />
            )}
            <span className="truncate">{folder.title}</span>
            <ChevronRight
              className={clsx(
                "ml-auto h-4 w-4 transition-transform duration-200",
                expandedFolders.has(folder.id) && "rotate-90"
              )}
            />
          </div>
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4 space-y-1 py-1">
        {folder.notes?.map((note) => (
          <SidebarMenuSubItem key={note.id}>
            <SidebarMenuSubButton asChild>
              <Link
                href={`/dashboard/projects/${project.id}/folders/${folder.id}/notes/${note.id}`}
                className={clsx(
                  "hover:bg-accent/30 py-1",
                  isActive(
                    pathname,
                    `/dashboard/projects/${project.id}/folders/${folder.id}/notes/${note.id}`
                  ) && "bg-accent/90 hover:bg-accent "
                )}
              >
                <List className="mr-2 h-4 w-4" />
                <span className="truncate">{note.title}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
        {folder.Document?.map((doc) => (
          <SidebarMenuSubItem key={doc.id}>
            <SidebarMenuSubButton asChild>
              <Link
                href={`/dashboard/projects/${project.id}/folders/${folder.id}/documents/${doc.id}`}
                className={clsx(
                  "hover:bg-accent/30 py-1",
                  isActive(
                    pathname,
                    `/dashboard/projects/${project.id}/folders/${folder.id}/documents/${doc.id}`
                  ) && "bg-accent/90 hover:bg-accent "
                )}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className="truncate">{doc.originalName}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
