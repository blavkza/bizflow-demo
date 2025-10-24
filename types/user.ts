import { UserPermission, UserRole, UserStatus } from "@prisma/client";

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    case "suspended":
      return "destructive";
    case "pending_verification":
      return "outline";
    default:
      return "secondary";
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN":
    case "MANAGER_GENERAL":
      return "destructive";
    case "MANAGER":
      return "default";
    case "accountant":
    case "ADMIN_MANAGER":
    case "employee":
      return "secondary";
    case "viewer":
      return "outline";
    default:
      return "secondary";
  }
};

export interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  permissions: UserPermission[];
  avatar: string | null;
  status: UserStatus;
  createdAt: Date;
  lastLogin: Date | null;
}

export const PERMISSION_GROUPS = [
  {
    name: "Invoices",
    permissions: [
      UserPermission.INVOICES_CREATE,
      UserPermission.INVOICES_EDIT,
      UserPermission.INVOICES_DELETE,
      UserPermission.INVOICES_VIEW,
    ],
  },
  {
    name: "Quotations",
    permissions: [
      UserPermission.QUOTATIONS_CREATE,
      UserPermission.QUOTATIONS_EDIT,
      UserPermission.QUOTATIONS_DELETE,
      UserPermission.QUOTATIONS_VIEW,
    ],
  },
  {
    name: "Users",
    permissions: [
      UserPermission.USERS_CREATE,
      UserPermission.USERS_EDIT,
      UserPermission.USERS_DELETE,
      UserPermission.USERS_VIEW,
    ],
  },
  {
    name: "Attendence",
    permissions: [
      UserPermission.Attendence_CREATE,
      UserPermission.Attendence_EDIT,
      UserPermission.Attendence_DELETE,
      UserPermission.Attendence_VIEW,
    ],
  },
  {
    name: "Employees",
    permissions: [
      UserPermission.EMPLOYEES_CREATE,
      UserPermission.EMPLOYEES_EDIT,
      UserPermission.EMPLOYEES_VIEW,
    ],
  },
  {
    name: "Clients",
    permissions: [
      UserPermission.Clients_CREATE,
      UserPermission.Clients_EDIT,
      UserPermission.Clients_VIEW,
    ],
  },
  {
    name: "Settings",
    permissions: [UserPermission.SETTINGS_MANAGE, UserPermission.SETTINGS_VIEW],
  },
  {
    name: "Transactions",
    permissions: [
      UserPermission.TRANSACTIONS_MANAGE,
      UserPermission.TRANSACTIONS_VIEW,
    ],
  },
  {
    name: "Payroll",
    permissions: [UserPermission.PAYROLL_MANAGE, UserPermission.PAYROLL_VIEW],
  },
  {
    name: "Category",
    permissions: [UserPermission.CATEGORY_MANAGE, UserPermission.CATEGORY_VIEW],
  },
  {
    name: "Inventory",
    permissions: [
      UserPermission.INVENTORY_MANAGE,
      UserPermission.INVENTORY_VIEW,
    ],
  },
  {
    name: "Systems",
    permissions: [
      UserPermission.SYSTEMS_AI,
      UserPermission.SYSTEMS_DASHBOARD,
      UserPermission.SYSTEMS_NOTIFICATIONS,
    ],
  },
  {
    name: "Projects",
    permissions: [
      UserPermission.PROJECTS_CREATE,
      UserPermission.PROJECTS_DELETE,
      UserPermission.PROJECTS_VIEW,
    ],
  },
  {
    name: "Department",
    permissions: [
      UserPermission.DEPARTMENT_CREATE,
      UserPermission.DEPARTMENT_EDIT,
      UserPermission.DEPARTMENT_VIEW,
    ],
  },
];
