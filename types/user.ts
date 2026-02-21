import { UserPermission, UserRole, UserStatus, UserType } from "@prisma/client";

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
    name: "Expenses",
    permissions: [
      UserPermission.Expanses_CREATE,
      UserPermission.Expanses_EDIT,
      UserPermission.Expanses_DELETE,
      UserPermission.Expanses_VIEW,
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
    name: "Employees",
    permissions: [
      UserPermission.EMPLOYEES_CREATE,
      UserPermission.EMPLOYEES_EDIT,
      UserPermission.EMPLOYEES_DELETE,
      UserPermission.EMPLOYEES_VIEW,
    ],
  },
  {
    name: "Freelancers",
    permissions: [
      UserPermission.Freelancer_CREATE,
      UserPermission.Freelancer_EDIT,
      UserPermission.Freelancer_DELETE,
      UserPermission.Freelancer_VIEW,
    ],
  },
  {
    name: "Trainees",
    permissions: [
      UserPermission.Trainee_CREATE,
      UserPermission.Trainee_EDIT,
      UserPermission.Trainee_DELETE,
      UserPermission.Trainee_VIEW,
    ],
  },
  {
    name: "Trainers",
    permissions: [
      UserPermission.Trainer_CREATE,
      UserPermission.Trainer_EDIT,
      UserPermission.Trainer_DELETE,
      UserPermission.Trainer_VIEW,
    ],
  },
  {
    name: "Department",
    permissions: [
      UserPermission.DEPARTMENT_CREATE,
      UserPermission.DEPARTMENT_EDIT,
      UserPermission.DEPARTMENT_DELETE,
      UserPermission.DEPARTMENT_VIEW,
    ],
  },
  {
    name: "Clients",
    permissions: [
      UserPermission.Clients_CREATE,
      UserPermission.Clients_EDIT,
      UserPermission.Clients_DELETE,
      UserPermission.Clients_VIEW,
    ],
  },
  {
    name: "Attendance",
    permissions: [
      UserPermission.Attendence_CREATE,
      UserPermission.Attendence_EDIT,
      UserPermission.Attendence_DELETE,
      UserPermission.Attendence_VIEW,
    ],
  },
  {
    name: "Performance",
    permissions: [
      UserPermission.Perfomance_CREATE,
      UserPermission.Perfomance_EDIT,
      UserPermission.Perfomance_DELETE,
      UserPermission.Perfomance_VIEW,
    ],
  },
  {
    name: "Orders",
    permissions: [
      UserPermission.Order_CREATE,
      UserPermission.Order_EDIT,
      UserPermission.Order_DELETE,
      UserPermission.Order_VIEW,
    ],
  },
  {
    name: "Sales",
    permissions: [
      UserPermission.Sale_CREATE,
      UserPermission.Sale_EDIT,
      UserPermission.Sale_DELETE,
      UserPermission.Sale_VIEW,
    ],
  },
  {
    name: "Products",
    permissions: [
      UserPermission.Product_CREATE,
      UserPermission.Product_EDIT,
      UserPermission.Product_DELETE,
      UserPermission.Product_VIEW,
    ],
  },
  {
    name: "Services",
    permissions: [
      UserPermission.Service_CREATE,
      UserPermission.Service_EDIT,
      UserPermission.Service_DELETE,
      UserPermission.Service_VIEW,
    ],
  },
  {
    name: "Packages",
    permissions: [
      UserPermission.Package_CREATE,
      UserPermission.Package_EDIT,
      UserPermission.Package_DELETE,
      UserPermission.Package_VIEW,
    ],
  },
  {
    name: "Tools",
    permissions: [
      UserPermission.Tool_CREATE,
      UserPermission.Tool_EDIT,
      UserPermission.Tool_DELETE,
      UserPermission.Tool_VIEW,
    ],
  },
  {
    name: "Tool Rental",
    permissions: [
      UserPermission.ToolRental_CREATE,
      UserPermission.ToolRental_EDIT,
      UserPermission.ToolRental_DELETE,
      UserPermission.ToolRental_VIEW,
    ],
  },
  {
    name: "Worker Tools",
    permissions: [
      UserPermission.WORKER_TOOLS_CREATE,
      UserPermission.WORKER_TOOLS_EDIT,
      UserPermission.WORKER_TOOLS_DELETE,
      UserPermission.WORKER_TOOLS_VIEW,
    ],
  },
  {
    name: "Tool Requests",
    permissions: [
      UserPermission.TOOL_REQUESTS_CREATE,
      UserPermission.TOOL_REQUESTS_EDIT,
      UserPermission.TOOL_REQUESTS_DELETE,
      UserPermission.TOOL_REQUESTS_VIEW,
    ],
  },
  {
    name: "Tool Maintenance",
    permissions: [
      UserPermission.TOOL_MAINTENANCE_CREATE,
      UserPermission.TOOL_MAINTENANCE_EDIT,
      UserPermission.TOOL_MAINTENANCE_DELETE,
      UserPermission.TOOL_MAINTENANCE_VIEW,
    ],
  },
  {
    name: "Refunds",
    permissions: [
      UserPermission.Refund_CREATE,
      UserPermission.Refund_EDIT,
      UserPermission.Refund_DELETE,
      UserPermission.Refund_VIEW,
    ],
  },
  {
    name: "Vendors",
    permissions: [
      UserPermission.Vender_CREATE,
      UserPermission.Vender_EDIT,
      UserPermission.Vender_DELETE,
      UserPermission.Vender_VIEW,
    ],
  },
  {
    name: "Leave",
    permissions: [
      UserPermission.Leave_CREATE,
      UserPermission.Leave_EDIT,
      UserPermission.Leave_DELETE,
      UserPermission.Leave_VIEW,
    ],
  },
  {
    name: "Inventory",
    permissions: [
      UserPermission.INVENTORY_MANAGE,
      UserPermission.INVENTORY_VIEW,
    ],
  },
  {
    name: "Category",
    permissions: [UserPermission.CATEGORY_MANAGE, UserPermission.CATEGORY_VIEW],
  },
  {
    name: "Payroll",
    permissions: [UserPermission.PAYROLL_MANAGE, UserPermission.PAYROLL_VIEW],
  },
  {
    name: "Transactions",
    permissions: [
      UserPermission.TRANSACTIONS_MANAGE,
      UserPermission.TRANSACTIONS_VIEW,
    ],
  },
  {
    name: "Settings",
    permissions: [UserPermission.SETTINGS_MANAGE, UserPermission.SETTINGS_VIEW],
  },
  {
    name: "Systems",
    permissions: [
      UserPermission.SYSTEMS_AI,
      UserPermission.SYSTEMS_DASHBOARD,
      UserPermission.SYSTEMS_NOTIFICATIONS,
      UserPermission.DASHBOARD_FINANCES,
      UserPermission.DASHBOARD_PROJECTS,
      UserPermission.DASHBOARD_TASKs,
      UserPermission.DASHBOARD_WORKS,
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
    name: "POS",
    permissions: [UserPermission.POS_VIEW],
  },
  {
    name: "Loans",
    permissions: [
      UserPermission.LOANS_CREATE,
      UserPermission.LOANS_EDIT,
      UserPermission.LOANS_DELETE,
      UserPermission.LOANS_VIEW,
    ],
  },
  {
    name: "Lenders",
    permissions: [
      UserPermission.LENDERS_CREATE,
      UserPermission.LENDERS_EDIT,
      UserPermission.LENDERS_DELETE,
      UserPermission.LENDERS_VIEW,
    ],
  },
  {
    name: "Loan Payments",
    permissions: [
      UserPermission.LOAN_PAYMENTS_CREATE,
      UserPermission.LOAN_PAYMENTS_DELETE,
    ],
  },
  {
    name: "Coupons",
    permissions: [
      UserPermission.Coupon_CREATE,
      UserPermission.Coupon_EDIT,
      UserPermission.Coupon_DELETE,
      UserPermission.Coupon_VIEW,
    ],
  },
];

export interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  userType: UserType;
  employeeId?: string;
  freelancerId?: string;
  traineeId?: string;
  permissions: UserPermission[];
  avatar: string | null;
  status: UserStatus;
  createdAt: Date;
  lastLogin: Date | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
  };
  freelancer?: {
    id: string;
    firstName: string;
    lastName: string;
    freeLancerNumber: string;
    position: string;
  };
  trainee?: {
    id: string;
    firstName: string;
    lastName: string;
    traineeNumber: string;
    position: string;
  };
}

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
