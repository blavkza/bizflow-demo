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
  Calendar,
  TrendingUp,
  ChartNoAxesCombined,
  CalendarClockIcon,
  UserPlus,
} from "lucide-react";
import { SidebarData } from "../types/sidebar";
import { UserPermission, UserRole } from "@prisma/client";

const hasPermission = (
  permissions: UserPermission[],
  requiredPermission: UserPermission
): boolean => {
  return permissions.includes(requiredPermission);
};

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export const getSidebarData = (
  role: string,
  unreadCount: number = 0,
  permissions: UserPermission[]
): SidebarData => {
  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];
  const hasFullAccess = hasRole(role, fullAccessRoles);

  return {
    navMain: [
      {
        title: "Overview",
        items: [
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.SYSTEMS_DASHBOARD)
            ? [
                {
                  title: "Dashboard",
                  url: "/dashboard",
                  icon: Home,
                  color: "text-blue-500",
                  alwaysActive: true,
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.SYSTEMS_NOTIFICATIONS)
            ? [
                {
                  title: "Notifications",
                  url: "/dashboard/notifications",
                  icon: Bell,
                  badge: unreadCount > 0 ? unreadCount.toString() : undefined,
                  color: "text-red-500",
                },
              ]
            : []),
        ],
      },
      ...(hasFullAccess ||
      hasPermission(permissions, UserPermission.PROJECTS_VIEW)
        ? [
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
                  ].filter((item) => item !== null),
                },
              ],
            },
          ]
        : []),
      {
        title: "Financial Management",
        items: [
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.TRANSACTIONS_VIEW)
            ? [
                {
                  title: "Transactions",
                  url: "/dashboard/transactions",
                  icon: CreditCard,
                  color: "text-green-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.QUOTATIONS_VIEW)
            ? [
                {
                  title: "Quotations",
                  url: "/dashboard/quotations",
                  icon: FileText,
                  color: "text-purple-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.INVOICES_VIEW)
            ? [
                {
                  title: "Invoices",
                  url: "/dashboard/invoices",
                  icon: Receipt,
                  color: "text-pink-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.PAYROLL_VIEW)
            ? [
                {
                  title: "Payroll",
                  url: "/dashboard/payroll",
                  icon: Users,
                  color: "text-emerald-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.PAYROLL_VIEW)
            ? [
                {
                  title: "Expenses",
                  url: "/dashboard/expenses",
                  icon: ChartNoAxesCombined,
                  color: "text-red-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.CATEGORY_VIEW)
            ? [
                {
                  title: "Categories",
                  url: "/dashboard/categories",
                  icon: Building2,
                  color: "text-orange-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.INVENTORY_VIEW)
            ? [
                {
                  title: "Inventory",
                  url: "/dashboard/inventory",
                  icon: Store,
                  color: "text-green-500",
                },
              ]
            : []),
        ].filter((item) => item !== null),
      },
      {
        title: "Human Resources",
        items: [
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.EMPLOYEES_VIEW)
            ? [
                {
                  title: "Employees",
                  url: "/dashboard/human-resources/employees",
                  icon: Users,
                  color: "text-cyan-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.EMPLOYEES_VIEW)
            ? [
                {
                  title: "Freelancers",
                  url: "/dashboard/human-resources/freelancers",
                  icon: UserPlus,
                  color: "text-red-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.DEPARTMENT_VIEW)
            ? [
                {
                  title: "Departments",
                  url: "/dashboard/human-resources/departments",
                  icon: Briefcase,
                  color: "text-indigo-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.Attendence_VIEW)
            ? [
                {
                  title: "Attendence",
                  url: "/dashboard/human-resources/attendence",
                  icon: Calendar,
                  color: "text-cyan-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.DEPARTMENT_VIEW)
            ? [
                {
                  title: "Leaves",
                  url: "/dashboard/human-resources/leaves",
                  icon: CalendarClockIcon,
                  color: "text-yellow-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.Clients_VIEW)
            ? [
                {
                  title: "Clients",
                  url: "/dashboard/human-resources/clients",
                  icon: Building,
                  color: "text-fuchsia-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.USERS_VIEW)
            ? [
                {
                  title: "User Management",
                  url: "/dashboard/human-resources/users",
                  icon: UserCog,
                  color: "text-teal-500",
                },
              ]
            : []),
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.USERS_VIEW)
            ? [
                {
                  title: "Performance",
                  url: "/dashboard/human-resources/performance",
                  icon: TrendingUp,
                  color: "text-red-500",
                },
              ]
            : []),
        ].filter((item) => item !== null),
      },
      {
        title: "Tools",
        items: [
          ...(hasFullAccess ||
          hasPermission(permissions, UserPermission.SYSTEMS_AI)
            ? [
                {
                  title: "AI Assistant",
                  url: "/dashboard/ai-assistant",
                  icon: Bot,
                  color: "text-blue-500",
                },
              ]
            : []),

          {
            title: "Theme",
            url: "/dashboard/appearance",
            icon: Palette,
            color: "text-yellow-500",
          },
        ].filter((item) => item !== null),
      },
    ],
  };
};
