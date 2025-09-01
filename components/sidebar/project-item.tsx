"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, FolderKanban, List, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Project } from "@/types/sidebar";
import {
  getFolderColor,
  getTaskStatusColor,
  isActive,
} from "./utils/sidebar-helpers";
import { FolderItem } from "./folder-item";

interface ProjectItemProps {
  project: Project;
  pathname: string;
  expandedProjects: Set<string>;
  expandedFolders: Set<string>;
  onToggleProject: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onToggleStarred: (projectId: string) => void;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  pathname,
  expandedProjects,
  expandedFolders,
  onToggleProject,
  onToggleFolder,
  onToggleStarred,
}) => {
  return (
    <SidebarMenuItem key={project.id}>
      <div className="relative group">
        <Collapsible
          open={expandedProjects.has(project.id)}
          onOpenChange={() => onToggleProject(project.id)}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              asChild
              className={clsx(
                "w-full hover:bg-accent/50 pl-2",
                isActive(pathname, `/dashboard/projects/${project.id}`) &&
                  "bg-accent/90 hover:bg-accent "
              )}
            >
              <div>
                <FolderKanban
                  className={clsx("mr-2", getFolderColor(project.status))}
                />
                <span className="truncate">{project.title}</span>
                <button
                  className="ml-auto p-1 rounded-full hover:bg-accent"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleStarred(project.id);
                  }}
                >
                  {project.starred ? (
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </button>
                <ChevronRight
                  className={clsx(
                    "ml-1 h-4 w-4 transition-transform duration-200",
                    expandedProjects.has(project.id) && "rotate-90"
                  )}
                />
              </div>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-4 space-y-1 py-1">
            {/* Folder content */}
            {Array.isArray(project.folder) && project.folder.length > 0 && (
              <>
                {project.folder
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 2)
                  .map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      project={project}
                      pathname={pathname}
                      expandedFolders={expandedFolders}
                      onToggleFolder={onToggleFolder}
                    />
                  ))}
                {project.folder.length > 2 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span>View all folders ({project.folder.length})</span>
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </>
            )}

            {/* Tasks content */}
            {Array.isArray(project.tasks) && project.tasks.length > 0 ? (
              <>
                {project.tasks
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime()
                  )
                  .slice(0, 3)
                  .map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/dashboard/projects/tasks/${task.id}`}
                        className={clsx(
                          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive(
                            pathname,
                            `/dashboard/projects/tasks/${task.id}`
                          )
                            ? "bg-accent-900  dark:text-white text-black"
                            : "text-foreground hover:bg-accent/30"
                        )}
                      >
                        <List className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{task.title}</span>
                        <span className="ml-auto">
                          <Badge className={getTaskStatusColor(task.status)} />
                        </span>
                      </Link>
                    </li>
                  ))}
                {project.tasks.length > 3 && (
                  <li>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30"
                    >
                      <span className="text-xs">
                        View all tasks ({project.tasks.length})
                      </span>
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </li>
                )}
              </>
            ) : (
              <li>
                <span className="text-muted-foreground text-sm italic px-3">
                  No tasks yet
                </span>
              </li>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SidebarMenuItem>
  );
};
