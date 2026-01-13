"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import clsx from "clsx";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";

import { Project } from "@/types/sidebar";
import { getSidebarData } from "./utils/sidebar-data";
import { isActive } from "./utils/sidebar-helpers";
import { ProjectItem } from "./project-item";
import { SidebarFooterComponent } from "./sidebar-footer";
import { UserPermission } from "@prisma/client";
import SidebarHeaderComponent from "./sidebar-header";

interface AppSidebarProps {
  role: string;
  unreadCount?: number;
  projects?: Project[];
  userId?: string | null;
  permissions?: UserPermission[];
}

export function SidebarItems({
  role,
  permissions = [],
  unreadCount = 0,
  projects = [],
  userId,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const data = getSidebarData(role, unreadCount, permissions);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  const currentUserId = userId;

  useEffect(() => {
    if (projects) {
      setLocalProjects(projects);
    }
  }, [projects, currentUserId]);

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  const toggleStarred = async (projectId: string) => {
    const project = localProjects.find((p) => p.id === projectId);
    if (!project) return;

    const newStarredState = !project.starred;
    const previousStarredState = project.starred;

    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, starred: newStarredState } : p
      )
    );

    try {
      const response = await fetch(`/api/projects/${projectId}/star`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: newStarredState }),
      });

      if (!response.ok) throw new Error("Failed to update star");
    } catch (error) {
      console.error("Error toggling star:", error);
      toast.error("Failed to update star status");

      setLocalProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, starred: previousStarredState } : p
        )
      );
    }
  };

  const starredCount = localProjects.filter((item) => item.starred).length;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeaderComponent permissions={permissions} role={role} />

      <SidebarContent className="sidebar-content pb-8 overflow-y-auto h-[calc(100vh-180px)]">
        <div className="space-y-1">
          {data.navMain.map((section) => (
            <Collapsible
              key={section.title}
              defaultOpen={!collapsedSections.has(section.title)}
              className="border-b border-border/50 last:border-b-0"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-accent/30 cursor-pointer transition-colors">
                  <SidebarGroupLabel className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </SidebarGroupLabel>
                  <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-0 data-[state=closed]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroup className="border-0 p-0">
                  <SidebarGroupContent className="pt-0 pb-3">
                    <SidebarMenu>
                      {section.title === "Projects" ? (
                        <>
                          {section.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              <Collapsible defaultOpen>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    className={clsx(
                                      "w-full hover:bg-accent/50",
                                      isActive(pathname, item.url) &&
                                        "bg-accent/90 hover:bg-accent "
                                    )}
                                  >
                                    {item.icon && (
                                      <item.icon
                                        className={clsx("mr-2", item.color)}
                                      />
                                    )}
                                    <span>{item.title}</span>

                                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {item.subitems?.map((subItem) => (
                                      <SidebarMenuSubItem key={subItem.title}>
                                        <SidebarMenuSubButton asChild>
                                          <Link
                                            href={subItem.url || "#"}
                                            className={clsx(
                                              "hover:bg-accent/30",
                                              isActive(pathname, subItem.url) &&
                                                "bg-accent/90 hover:bg-accent ",
                                              subItem.title === "Favourite" &&
                                                "bg-amber-50 dark:bg-amber-900/20"
                                            )}
                                          >
                                            {subItem.icon && (
                                              <subItem.icon
                                                className={clsx(
                                                  "mr-2",
                                                  subItem.color
                                                )}
                                              />
                                            )}
                                            <span>{subItem.title}</span>
                                            {subItem.badge && (
                                              <Badge
                                                variant={
                                                  subItem.title === "Favourite"
                                                    ? "default"
                                                    : "outline"
                                                }
                                                className={clsx(
                                                  "ml-auto h-5 w-5 shrink-0 items-center justify-center p-0 text-xs",
                                                  subItem.title ===
                                                    "Favourite" &&
                                                    "bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-200"
                                                )}
                                              >
                                                {starredCount}
                                              </Badge>
                                            )}
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </Collapsible>
                            </SidebarMenuItem>
                          ))}

                          {localProjects
                            .sort(
                              (a, b) =>
                                new Date(b.updatedAt).getTime() -
                                new Date(a.updatedAt).getTime()
                            )
                            .slice(0, 3)
                            .map((project) => (
                              <ProjectItem
                                key={project.id}
                                project={project}
                                pathname={pathname}
                                expandedProjects={expandedProjects}
                                expandedFolders={expandedFolders}
                                onToggleProject={toggleProject}
                                onToggleFolder={toggleFolder}
                                onToggleStarred={toggleStarred}
                              />
                            ))}
                        </>
                      ) : (
                        section.items.map((item) => {
                          if (item.subitems) {
                            return (
                              <SidebarMenuItem key={item.title}>
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                      className={clsx(
                                        "w-full hover:bg-accent/50",
                                        isActive(pathname, item.url) &&
                                          "bg-accent/90 hover:bg-accent "
                                      )}
                                    >
                                      {item.icon && (
                                        <item.icon
                                          className={clsx("mr-2", item.color)}
                                        />
                                      )}
                                      <span>{item.title}</span>
                                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {item.subitems.map((subItem) => (
                                        <SidebarMenuSubItem key={subItem.title}>
                                          <SidebarMenuSubButton asChild>
                                            <Link
                                              href={subItem.url || "#"}
                                              className={clsx(
                                                "hover:bg-accent/30",
                                                isActive(
                                                  pathname,
                                                  subItem.url
                                                ) &&
                                                  "bg-accent/90 hover:bg-accent "
                                              )}
                                            >
                                              {subItem.icon && (
                                                <subItem.icon
                                                  className={clsx(
                                                    "mr-2",
                                                    subItem.color
                                                  )}
                                                />
                                              )}
                                              <span>{subItem.title}</span>
                                            </Link>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </Collapsible>
                              </SidebarMenuItem>
                            );
                          }

                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                className={clsx(
                                  "hover:bg-accent/50",
                                  isActive(
                                    pathname,
                                    item.url,
                                    item.alwaysActive
                                  ) && "bg-accent/90 hover:bg-accent "
                                )}
                              >
                                <Link href={item.url || "#"}>
                                  {item.icon && (
                                    <item.icon
                                      className={clsx("mr-2", item.color)}
                                    />
                                  )}
                                  <span>{item.title}</span>
                                  {item.badge && (
                                    <Badge
                                      variant={
                                        isActive(pathname, item.url)
                                          ? "default"
                                          : "destructive"
                                      }
                                      className="ml-auto h-5 w-5 shrink-0 items-center justify-center p-0 text-xs"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </SidebarContent>

      <SidebarFooterComponent pathname={pathname} />
    </Sidebar>
  );
}
