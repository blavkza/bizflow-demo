"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  Settings,
  Users,
  Calculator,
  Receipt,
  Bell,
  UserCog,
  Building,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Store,
  Palette,
  Bot,
  FolderKanban,
  Folder,
  FolderOpen,
  Star,
  Clock,
  Archive,
  List,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import clsx from "clsx";
import Profile from "./profile";
import Image from "next/image";
import { Project } from "@/types/sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { toast } from "sonner";
import { IoReloadOutline } from "react-icons/io5";
import { Button } from "./ui/button";

interface AppSidebarProps {
  role: string;
  unreadCount?: number;
  projects?: Project[];
  userId?: string | null;
}

interface NavItem {
  title: string;
  url?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  badge?: string;
  subitems?: NavItem[];
  alwaysActive?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const getSidebarData = (
  role: string,
  unreadCount: number = 0
): { navMain: NavSection[] } => {
  return {
    navMain: [
      {
        title: "Overview",
        items: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: Home,
            color: "text-blue-500",
            alwaysActive: true,
          },
          {
            title: "Notifications",
            url: "/dashboard/notifications",
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount.toString() : undefined,
            color: "text-red-500",
          },
        ],
      },
      {
        title: "Projects",
        items: [
          {
            title: "Projects",
            icon: FolderOpen,
            color: "text-yellow-500",
            subitems: [
              {
                title: "All Projects",
                url: "/dashboard/projects",
                icon: FolderOpen,
                color: "text-yellow-500",
              },
              {
                title: "Favourite",
                url: `/dashboard/projects?starred=true`,
                icon: Star,
                color: "text-amber-400",
                badge: "2",
              },
              {
                title: "Archived",
                url: `/dashboard/projects?archived=true`,
                icon: Archive,
                color: "text-gray-400",
              },
            ],
          },
        ],
      },
      {
        title: "Financial Management",
        items: [
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "Transactions",
                  url: "/dashboard/transactions",
                  icon: CreditCard,
                  color: "text-green-500",
                },
              ]
            : []),
          {
            title: "Quotations",
            url: "/dashboard/quotations",
            icon: FileText,
            color: "text-purple-500",
          },
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "Invoices",
                  url: "/dashboard/invoices",
                  icon: Receipt,
                  color: "text-pink-500",
                },
              ]
            : []),
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "Payroll",
                  url: "/dashboard/payroll",
                  icon: Users,
                  color: "text-emerald-500",
                },
              ]
            : []),
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "Categories",
                  url: "/dashboard/categories",
                  icon: Building2,
                  color: "text-orange-500",
                },
              ]
            : []),
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "Inventory",
                  url: "/dashboard/inventory",
                  icon: Store,
                  color: "text-green-500",
                },
              ]
            : []),
        ],
      },
      {
        title: "Human Resources",
        items: [
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "Employees",
                  url: "/dashboard/human-resources/employees",
                  icon: Users,
                  color: "text-cyan-500",
                },
              ]
            : []),
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "Departments",
                  url: "/dashboard/human-resources/departments",
                  icon: Briefcase,
                  color: "text-indigo-500",
                },
              ]
            : []),
          {
            title: "Clients",
            url: "/dashboard/human-resources/clients",
            icon: Building,
            color: "text-fuchsia-500",
          },
          ...(role === "GENERAL_MANAGER" || role === "CHIEF_EXECUTIVE_OFFICER"
            ? [
                {
                  title: "User Management",
                  url: "/dashboard/human-resources/users",
                  icon: UserCog,
                  color: "text-teal-500",
                },
              ]
            : []),
        ],
      },
      {
        title: "Tools",
        items: [
          {
            title: "AI Assistant",
            url: "/dashboard/ai-assistant",
            icon: Bot,
            color: "text-blue-500",
          },
          {
            title: "Appearance",
            url: "/dashboard/appearance",
            icon: Palette,
            color: "text-yellow-500",
          },
        ],
      },
    ],
  };
};

const getFolderColor = (status: string | null) => {
  switch (status) {
    case "ACTIVE":
      return "text-blue-500 ";
    case "COMPLETED":
      return "text-green-500 ";
    case "ON_HOLD":
      return "text-orange-500 ";
    default:
      return "text-zinc-700 dark:text-zinc-200";
  }
};

const getTaskStatusColor = (status: string | null) => {
  switch (status) {
    case "TODO":
      return "bg-blue-500 text-white";
    case "COMPLETED":
      return "bg-green-500 text-white";
    case "IN_PROGRESS":
      return "bg-orange-500 text-white";
    default:
      return "bg-muted text-white";
  }
};

export function SidebarItems({
  role,
  unreadCount = 0,
  projects = [],
  userId,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const data = getSidebarData(role, unreadCount);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const [localProjects, setLocalProjects] = useState<Project[]>([]);

  const currentUserId = userId;

  useEffect(() => {
    const filteredProjects = projects.filter((project) => {
      if (project.archived) return false;

      const isManager = project.managerId === currentUserId;

      const isTeamMember = project.teamMembers?.some(
        (member: any) => member.id === currentUserId
      );

      /* const isSuperAdmin = role === "CHIEF_EXECUTIVE_OFFICER";

      if (isSuperAdmin) return true; */

      return isManager || isTeamMember;
    });

    setLocalProjects(filteredProjects);
  }, [projects, currentUserId]);

  const getLastSegment = (url: string) => {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  };

  const isActive = (url?: string, alwaysActive = false) => {
    if (!url) return false;

    const current = getLastSegment(pathname);
    const target = getLastSegment(url);

    if (alwaysActive) return current === target;
    return current === target;
  };

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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-100">
                    <Link href="/">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </Link>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight select-none">
                    <span className="truncate font-semibold">BizFlow</span>
                    <span className="truncate text-xs">Management System</span>
                  </div>
                </div>
                <Button variant={"ghost"} size={"icon"}>
                  <IoReloadOutline size={24} />
                </Button>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="py-1">
              <GlobalSearch />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="sidebar-content pb-8 overflow-y-auto h-[calc(100vh-180px)]">
        <div className="space-y-6">
          {data.navMain.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
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
                                  isActive(item.url) &&
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
                                          isActive(subItem.url) &&
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
                                              subItem.title === "Favourite" &&
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
                          <SidebarMenuItem key={project.id}>
                            <div className="relative group">
                              <Collapsible
                                open={expandedProjects.has(project.id)}
                                onOpenChange={() => toggleProject(project.id)}
                              >
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    asChild
                                    className={clsx(
                                      "w-full hover:bg-accent/50 pl-2",
                                      isActive(
                                        `/dashboard/projects/${project.id}`
                                      ) && "bg-accent/90 hover:bg-accent "
                                    )}
                                  >
                                    <div>
                                      <FolderKanban
                                        className={clsx(
                                          "mr-2",
                                          getFolderColor(project.status)
                                        )}
                                      />
                                      <span className="truncate">
                                        {project.title}
                                      </span>
                                      <button
                                        className="ml-auto p-1 rounded-full hover:bg-accent"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleStarred(project.id);
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
                                          expandedProjects.has(project.id) &&
                                            "rotate-90"
                                        )}
                                      />
                                    </div>
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="ml-4 space-y-1 py-1">
                                  {Array.isArray(project.folder) &&
                                    project.folder.length > 0 && (
                                      <>
                                        {project.folder
                                          .sort(
                                            (a, b) =>
                                              new Date(b.createdAt).getTime() -
                                              new Date(a.createdAt).getTime()
                                          )
                                          .slice(0, 2)
                                          .map((folder) => (
                                            <Collapsible
                                              key={folder.id}
                                              open={expandedFolders.has(
                                                folder.id
                                              )}
                                              onOpenChange={() =>
                                                toggleFolder(folder.id)
                                              }
                                            >
                                              <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                  asChild
                                                  className={clsx(
                                                    "w-full hover:bg-accent/50",
                                                    isActive(
                                                      `/dashboard/projects/${project.id}/folders/${folder.id}`
                                                    ) &&
                                                      "bg-accent/90 hover:bg-accent "
                                                  )}
                                                >
                                                  <div>
                                                    {expandedFolders.has(
                                                      folder.id
                                                    ) ? (
                                                      <FolderOpen
                                                        className={clsx(
                                                          "mr-2 h-4 w-4"
                                                        )}
                                                      />
                                                    ) : (
                                                      <Folder
                                                        className={clsx(
                                                          "mr-2 h-4 w-4"
                                                        )}
                                                      />
                                                    )}
                                                    <span className="truncate">
                                                      {folder.title}
                                                    </span>
                                                    <ChevronRight
                                                      className={clsx(
                                                        "ml-auto h-4 w-4 transition-transform duration-200",
                                                        expandedFolders.has(
                                                          folder.id
                                                        ) && "rotate-90"
                                                      )}
                                                    />
                                                  </div>
                                                </SidebarMenuButton>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent className="ml-4 space-y-1 py-1">
                                                {folder.notes?.map((note) => (
                                                  <SidebarMenuSubItem
                                                    key={note.id}
                                                  >
                                                    <SidebarMenuSubButton
                                                      asChild
                                                    >
                                                      <Link
                                                        href={`/dashboard/projects/${project.id}/folders/${folder.id}/notes/${note.id}`}
                                                        className={clsx(
                                                          "hover:bg-accent/30 py-1",
                                                          isActive(
                                                            `/dashboard/projects/${project.id}/folders/${folder.id}/notes/${note.id}`
                                                          ) &&
                                                            "bg-accent/90 hover:bg-accent "
                                                        )}
                                                      >
                                                        <List className="mr-2 h-4 w-4" />
                                                        <span className="truncate">
                                                          {note.title}
                                                        </span>
                                                      </Link>
                                                    </SidebarMenuSubButton>
                                                  </SidebarMenuSubItem>
                                                ))}
                                                {folder.Document?.map((doc) => (
                                                  <SidebarMenuSubItem
                                                    key={doc.id}
                                                  >
                                                    <SidebarMenuSubButton
                                                      asChild
                                                    >
                                                      <Link
                                                        href={`/dashboard/projects/${project.id}/folders/${folder.id}/documents/${doc.id}`}
                                                        className={clsx(
                                                          "hover:bg-accent/30 py-1",
                                                          isActive(
                                                            `/dashboard/projects/${project.id}/folders/${folder.id}/documents/${doc.id}`
                                                          ) &&
                                                            "bg-accent/90 hover:bg-accent "
                                                        )}
                                                      >
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        <span className="truncate">
                                                          {doc.originalName}
                                                        </span>
                                                      </Link>
                                                    </SidebarMenuSubButton>
                                                  </SidebarMenuSubItem>
                                                ))}
                                              </CollapsibleContent>
                                            </Collapsible>
                                          ))}
                                        {project.folder.length > 2 && (
                                          <SidebarMenuItem>
                                            <SidebarMenuButton asChild>
                                              <Link
                                                href={`/dashboard/projects/${project.id}`}
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                              >
                                                <span>
                                                  View all folders (
                                                  {project.folder.length})
                                                </span>
                                                <ChevronRight className="ml-1 h-3 w-3" />
                                              </Link>
                                            </SidebarMenuButton>
                                          </SidebarMenuItem>
                                        )}
                                      </>
                                    )}
                                  {Array.isArray(project.tasks) &&
                                  project.tasks.length > 0 ? (
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
                                                  `/dashboard/projects/tasks/${task.id}`
                                                )
                                                  ? "bg-accent-900  text-white"
                                                  : "text-foreground hover:bg-accent/30"
                                              )}
                                            >
                                              <List className="mr-2 h-4 w-4 flex-shrink-0" />
                                              <span className="flex-1">
                                                {task.title}
                                              </span>
                                              <span className="ml-auto">
                                                <Badge
                                                  className={getTaskStatusColor(
                                                    task.status
                                                  )}
                                                />
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
                                              View all tasks (
                                              {project.tasks.length})
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
                              {/* {project.starred && (
                                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-400 rounded-l" />
                              )} */}
                            </div>
                          </SidebarMenuItem>
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
                                    isActive(item.url) &&
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
                                            isActive(subItem.url) &&
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
                              isActive(item.url, item.alwaysActive) &&
                                "bg-accent/90 hover:bg-accent "
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
                                    isActive(item.url)
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
          ))}
        </div>
      </SidebarContent>

      <SidebarFooter className="py-0 my-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Profile />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/dashboard/settings"
                className={clsx(
                  "hover:bg-accent/50",
                  isActive("/dashboard/settings") &&
                    "bg-accent/90 hover:bg-accent "
                )}
              >
                <Settings className="text-muted-foreground mr-2" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
