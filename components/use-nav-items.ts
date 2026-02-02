"use client";

import {
  Home,
  Bell,
  CreditCard,
  Calculator,
  FileText,
  Receipt,
  Users,
  Building2,
  Store,
  UserCog,
  Briefcase,
  Building,
  Hammer,
  RefreshCcw,
} from "lucide-react";

export const useNavItems = (role: string) => {
  const baseNavItems = [
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
          badge: "3",
          color: "text-red-500",
        },
      ],
    },
    {
      title: "Financial Management",
      items: [
        {
          title: "Transactions",
          url: "/dashboard/transactions",
          icon: CreditCard,
          color: "text-green-500",
        },
        {
          title: "Budget Management",
          url: "/dashboard/budget",
          icon: Calculator,
          color: "text-yellow-500",
        },
        {
          title: "Quotations",
          url: "/dashboard/quotations",
          icon: FileText,
          badge: "2",
          color: "text-purple-500",
        },
        {
          title: "Invoices",
          url: "/dashboard/invoices",
          icon: Receipt,
          badge: "5",
          color: "text-pink-500",
        },
        {
          title: "Payroll",
          url: "/dashboard/payroll",
          icon: Users,
          color: "text-emerald-500",
        },
        {
          title: "Categories",
          url: "/dashboard/categories",
          icon: Building2,
          color: "text-orange-500",
        },
        {
          title: "Inventory",
          url: "/dashboard/inventory",
          icon: Store,
          color: "text-green-500",
        },
      ],
    },
    {
      title: "Tools & Assets",
      items: [
        {
          title: "Tool Requests",
          url: "/dashboard/tools/tool-request",
          icon: FileText,
          color: "text-blue-500",
        },
        {
          title: "Tool Inventory",
          url: "/dashboard/tools/worker-tools",
          icon: Hammer,
          color: "text-amber-500",
        },
        {
          title: "Tool Returns",
          url: "/dashboard/tools/worker-tools/return",
          icon: RefreshCcw,
          color: "text-emerald-500",
        },
      ],
    },
    {
      title: "Human Resources",
      items: [
        {
          title: "Employees",
          url: "/dashboard/human-resources/employees",
          icon: Users,
          color: "text-cyan-500",
        },
        {
          title: "Departments",
          url: "/dashboard/human-resources/departments",
          icon: Briefcase,
          color: "text-indigo-500",
        },
        {
          title: "Clients",
          url: "/dashboard/human-resources/clients",
          icon: Building,
          color: "text-fuchsia-500",
        },
        ...(role === "Super_admin"
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
  ];

  return baseNavItems;
};
