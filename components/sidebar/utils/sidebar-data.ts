import {
  Home,
  Bell,
  FolderOpen,
  Star,
  Archive,
  CreditCard,
  FileText,
  Receipt,
  Users,
  Building2,
  Store,
  Building,
  Briefcase,
  UserCog,
  Bot,
  Palette,
} from "lucide-react";
import { SidebarData } from "../types/sidebar";

export const getSidebarData = (
  role: string,
  unreadCount: number = 0
): SidebarData => {
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
