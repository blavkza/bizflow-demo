"use client";

import type * as React from "react";
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
  Target,
  TrendingUp,
  ChevronRight,
  Store,
  Palette,
  Bot,
  File,
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

interface AppSidebarProps {
  role: string;
  unreadCount?: number;
}

interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  badge?: string;
  subitems?: NavItem[];
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
          /* {
            title: "Bank Statement",
            url: "/dashboard/uploaded-transactions",
            icon: File,
            color: "text-blue-500",
          }, */
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

export function SidebarItems({
  role,
  unreadCount = 0,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const data = getSidebarData(role, unreadCount);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg dark:bg-zinc-100 bg-zinc-200 text-sidebar-primary-foreground">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FinanceFlow</span>
                  <span className="truncate text-xs">Management System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pb-8">
        {data.navMain.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  if (item.subitems) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Collapsible className="w-full group" asChild>
                          <>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.title}>
                                {item.icon && (
                                  <item.icon
                                    className={clsx("mr-2", item.color)}
                                  />
                                )}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subitems.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <Link href={subItem.url}>
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton tooltip={item.title} asChild>
                        <Link href={item.url}>
                          {item.icon && (
                            <item.icon className={clsx("mr-2", item.color)} />
                          )}
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="destructive"
                              className="ml-auto h-5 w-5 shrink-0 items-center justify-center p-0 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
              <Link href="/dashboard/settings">
                <Settings className="text-muted-foreground mr-1" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
