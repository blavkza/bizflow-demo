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
  BoxesIcon,
  ScanBarcode,
  CircleDollarSign,
  HandCoins,
  Wrench,
  Box,
  Settings,
  Truck,
  NotepadTextIcon,
  TicketPercent,
  Landmark,
  Hammer,
  ClipboardList,
  RefreshCcw,
  Bolt,
  Siren,
} from "lucide-react";
import { GiTakeMyMoney } from "react-icons/gi";
import { CgArrowsExchange } from "react-icons/cg";
import { GrDocumentExcel, GrServices } from "react-icons/gr";

import { SidebarData } from "../types/sidebar";
import { UserPermission, UserRole } from "@prisma/client";
import { IoCash } from "react-icons/io5";
import { FaFileInvoice } from "react-icons/fa";

const hasPermission = (
  permissions: UserPermission[],
  requiredPermission: UserPermission,
): boolean => {
  return permissions.includes(requiredPermission);
};

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export const getSidebarData = (
  role: string,
  unreadCount: number = 0,
  permissions: UserPermission[],
): SidebarData => {
  const fullAccessRoles = [
    UserRole.CHIEF_EXECUTIVE_OFFICER,
    UserRole.ADMIN_MANAGER,
    UserRole.GENERAL_MANAGER,
  ];
  const hasFullAccess = hasRole(role, fullAccessRoles);

  // Helper function to filter items and check if section should be included
  const getSectionItems = (
    sectionItems: Array<any | null>,
  ): { hasItems: boolean; items: any[] } => {
    const filteredItems = sectionItems.filter((item) => item !== null);
    return {
      hasItems: filteredItems.length > 0,
      items: filteredItems,
    };
  };

  // Admin section
  const adminSection = getSectionItems([
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Package_VIEW)
      ? [
          {
            title: "Packaged Combo",
            url: "/dashboard/package-categories",
            icon: BoxesIcon,
            color: "text-orange-500",
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
            icon: FaFileInvoice,
            color: "text-pink-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.INVOICES_VIEW)
      ? [
          {
            title: "Delivery Note",
            url: "/dashboard/invoice-documents?type=delivery-note",
            icon: Truck,
            color: "text-yellow-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.INVOICES_VIEW)
      ? [
          {
            title: "Purchase Order",
            url: "/dashboard/invoice-documents?type=purchase-order",
            icon: Receipt,
            color: "text-green-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.INVOICES_VIEW)
      ? [
          {
            title: "Pro Forma Invoice",
            url: "/dashboard/invoice-documents?type=pro-forma-invoice",
            icon: FaFileInvoice,
            color: "text-perpul-500",
          },
        ]
      : []),

    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.INVOICES_VIEW)
      ? [
          {
            title: "Credit Note",
            url: "/dashboard/invoice-documents?type=credit-note",
            icon: NotepadTextIcon,
            color: "text-pink-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.INVOICES_VIEW)
      ? [
          {
            title: "Supplier List",
            url: "/dashboard/invoice-documents?type=supplier-list",
            icon: Receipt,
            color: "text-orange-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Refund_VIEW)
      ? [
          {
            title: "Refunds",
            url: "/dashboard/refunds",
            icon: HandCoins,
            color: "text-green-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.Expanses_VIEW)
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
    hasPermission(permissions, UserPermission.TRANSACTIONS_VIEW)
      ? [
          {
            title: "Business Loans",
            url: "/dashboard/loans",
            icon: Landmark,
            color: "text-blue-500",
          },
          {
            title: "Loan Lenders",
            url: "/dashboard/loans/lenders",
            icon: Building2,
            color: "text-cyan-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Service_VIEW)
      ? [
          {
            title: "Services",
            url: "/dashboard/services",
            icon: GrServices,
            color: "text-blue-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Clients_VIEW)
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
  ]);

  // Shop section
  const shopSection = getSectionItems([
    ...(hasFullAccess || hasPermission(permissions, UserPermission.POS_VIEW)
      ? [
          {
            title: "Point Of Sale",
            url: "/dashboard/shop/pos",
            icon: Store,
            color: "text-red-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Sale_VIEW)
      ? [
          {
            title: "Sales Quotations",
            url: "/dashboard/shop/qoutations",
            icon: Box,
            color: "text-yellow-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Sale_VIEW)
      ? [
          {
            title: "Awaiting Stocks",
            url: "/dashboard/shop/stock-awaits",
            icon: CgArrowsExchange,
            color: "text-purple-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Sale_VIEW)
      ? [
          {
            title: "Sales",
            url: "/dashboard/shop/sales",
            icon: CircleDollarSign,
            color: "text-blue-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Order_VIEW)
      ? [
          {
            title: "Orders",
            url: "/dashboard/shop/orders",
            icon: BoxesIcon,
            color: "text-green-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Product_VIEW)
      ? [
          {
            title: "Products",
            url: "/dashboard/shop/products",
            icon: ScanBarcode,
            color: "text-pink-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.CATEGORY_VIEW)
      ? [
          {
            title: "Products Categories",
            url: "/dashboard/shop/categories",
            icon: Building2,
            color: "text-red-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Sale_VIEW)
      ? [
          {
            title: "Coupons",
            url: "/dashboard/shop/coupons",
            icon: TicketPercent,
            color: "text-green-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Vender_VIEW)
      ? [
          {
            title: "Suppliers",
            url: "/dashboard/suppliers",
            icon: CgArrowsExchange,
            color: "text-Orange-500",
          },
        ]
      : []),
  ]);

  // Projects section (handled separately due to its structure)
  const projectsSection =
    hasFullAccess || hasPermission(permissions, UserPermission.PROJECTS_VIEW)
      ? {
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
        }
      : null;

  // Tools section
  const toolsSection = getSectionItems([
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Tool_VIEW)
      ? [
          {
            title: "Tools Management",
            url: "/dashboard/tools",
            icon: Wrench,
            color: "text-red-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.ToolRental_VIEW)
      ? [
          {
            title: "Tools Rentals",
            url: "/dashboard/rentals",
            icon: GiTakeMyMoney,
            color: "text-green-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.WORKER_TOOLS_VIEW)
      ? [
          {
            title: "Tools Allocation",
            url: "/dashboard/tools/worker-tools",
            icon: Hammer,
            color: "text-orange-500",
          },
          {
            title: "Tool Returns",
            url: "/dashboard/tools/worker-tools/return",
            icon: RefreshCcw,
            color: "text-emerald-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.TOOL_REQUESTS_VIEW)
      ? [
          {
            title: "Tool Requests",
            url: "/dashboard/tools/tool-request",
            icon: ClipboardList,
            color: "text-blue-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.TOOL_MAINTENANCE_VIEW)
      ? [
          {
            title: "Tool Maintenance",
            url: "/dashboard/tools/tool-maintenance",
            icon: Bolt,
            color: "text-gray-500",
          },
        ]
      : []),
  ]);

  // Human Resources section
  const hrSection = getSectionItems([
    ...(hasFullAccess || hasPermission(permissions, UserPermission.PAYROLL_VIEW)
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
    hasPermission(permissions, UserPermission.Freelancer_VIEW)
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
    ...(hasFullAccess
      ? [
          {
            title: "Emergency Call-Outs",
            url: "/dashboard/emergency-callouts",
            icon: Siren,
            color: "text-red-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Leave_VIEW)
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
    hasPermission(permissions, UserPermission.Perfomance_VIEW)
      ? [
          {
            title: "Performance",
            url: "/dashboard/human-resources/performance",
            icon: TrendingUp,
            color: "text-red-500",
          },
        ]
      : []),
    ...(hasFullAccess || hasPermission(permissions, UserPermission.Vender_VIEW)
      ? [
          {
            title: "Suppliers",
            url: "/dashboard/suppliers",
            icon: CgArrowsExchange,
            color: "text-Orange-500",
          },
        ]
      : []),
  ]);

  // Director section
  const directorSection = getSectionItems([
    ...(hasFullAccess || hasPermission(permissions, UserPermission.USERS_VIEW)
      ? [
          {
            title: "User Management",
            url: "/dashboard/human-resources/users",
            icon: UserCog,
            color: "text-teal-500",
          },
        ]
      : []),
  ]);

  // System section
  const systemSection = getSectionItems([
    ...(hasFullAccess || hasPermission(permissions, UserPermission.SYSTEMS_AI)
      ? [
          {
            title: "AI Assistant",
            url: "/dashboard/ai-assistant",
            icon: Bot,
            color: "text-blue-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.SYSTEMS_NOTIFICATIONS)
      ? [
          {
            title: "System Activities",
            url: "/dashboard/notifications",
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount.toString() : undefined,
            color: "text-red-500",
          },
        ]
      : []),
    ...(hasFullAccess ||
    hasPermission(permissions, UserPermission.SETTINGS_VIEW)
      ? [
          {
            title: "settings",
            url: "/dashboard/settings",
            icon: Settings,
            color: "text-blue-500",
          },
        ]
      : []),
    // Always include theme as it doesn't seem to require a permission
    {
      title: "Theme",
      url: "/dashboard/appearance",
      icon: Palette,
      color: "text-yellow-500",
    },
  ]);

  // Build navMain array, only including sections with items
  const navMain = [];

  // Overview section
  const overviewSection = getSectionItems([
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
  ]);

  if (overviewSection.hasItems) {
    navMain.push({
      title: "Overview",
      items: overviewSection.items,
    });
  }

  if (adminSection.hasItems) {
    navMain.push({
      title: "Admin",
      items: adminSection.items,
    });
  }

  if (shopSection.hasItems) {
    navMain.push({
      title: "Shop",
      items: shopSection.items,
    });
  }

  if (projectsSection) {
    navMain.push(projectsSection);
  }

  if (toolsSection.hasItems) {
    navMain.push({
      title: "Tools",
      items: toolsSection.items,
    });
  }

  if (hrSection.hasItems) {
    navMain.push({
      title: "Human Resources",
      items: hrSection.items,
    });
  }

  if (directorSection.hasItems) {
    navMain.push({
      title: "Director",
      items: directorSection.items,
    });
  }

  if (systemSection.hasItems) {
    navMain.push({
      title: "System",
      items: systemSection.items,
    });
  }

  return {
    navMain,
  };
};
