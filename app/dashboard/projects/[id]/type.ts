import { Priority, ProjectStatus, TaskStatus, User } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  phone2: string | null;
}

export interface Manager {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  Expense?: Expense[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  estimatedHours: Decimal;
  assignees?: { firstName: string; lastName: string; avatar: string }[];
  freeLancerAssignees?: {
    firstName: string;
    lastName: string;
    avatar: string;
    type?: "freelancer";
  }[];
  traineeAssignees?: {
    firstName: string;
    lastName: string;
    avatar: string;
    type?: "trainee";
  }[];
  taskNumber: string;

  dueDate: string;
  startTime?: string | null;
  endTime?: string | null;
  allocatedTime?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: string;
  url: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  title: string;
  projectId: string;
  Document: Document[];
  Note: Note[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeam {
  id: string;
  projectId: string;
  userId: string;
  role: string;

  // Permissions
  canEditTask: boolean;
  canDeleteTask: boolean;
  canDeleteFiles: boolean;
  canAddInvoice: boolean;
  canCreateTask: boolean;
  canEditFile: boolean;
  canUploadFiles: boolean;
  canViewFinancial: boolean;
  canAddWorkLog: boolean; // Add work log permission

  createdAt: Date;
  updatedAt: Date;

  project?: Project;
  user?: User;
}

export interface CommentReply {
  id: string;
  content: string;
  commentId: string;
  liked: boolean;
  commenterName: string;
  commenterId: string;
  commenterAvatar: string | null;
  commenterRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  projectId: string | null;
  liked: boolean;
  pinned: boolean;
  commenterName: string;
  commenterId: string;
  commenterAvatar: string | null;
  commenterRole: string | null;
  commentReply: CommentReply[];
  createdAt: string;
  updatedAt: string;
}

// Add WorkLog interface
export interface WorkLog {
  id: string;
  date: string;
  hours: number;
  description: string;
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface Project {
  id: string;
  projectNumber: string;
  title: string;
  description: string | null;
  projectType: ProjectType;
  billingType: BillingType | null;
  clientId: string | null;
  managerId: string;
  status: ProjectStatus;
  priority: Priority;
  archived: boolean;
  starred: boolean;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  budget: number | null;
  budgetSpent: number | null;
  currency: string;
  hourlyRate: number | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  teamMembers?: ProjectTeam[];
  manager: Manager;
  tasks: Task[];
  invoices: Invoice[];
  Folder: Folder[];
  documents: Document[];
  comment: Comment[];
  Expense: Expense[];
  toolInterUses: ToolInterUse[];
  assistantEmployees?: { id: string; name: string; avatar: string | null }[];
  assistantFreelancers?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  }[];
  assistantTrainees?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  }[];
  scheduledStartTime?: string | null;

  workLogs: WorkLog[];
  tools?: Tool[];
}

export enum ProjectType {
  NEW_PROJECT = "NEW_PROJECT",
  RETURN_JOB = "RETURN_JOB",
  MAINTENANCE = "MAINTENANCE",
  FAULT_FINDING = "FAULT_FINDING",
}

export enum BillingType {
  INVOICED = "INVOICED",
  MAINTENANCE_CONTRACT = "MAINTENANCE_CONTRACT",
}

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  condition: string;
  rentalRateDaily: Decimal | null;
  rentalRateWeekly: Decimal | null;
  rentalRateMonthly: Decimal | null;
  primaryImage: string | null;
  parentToolId?: string | null;
  code?: string | null;
}

export interface ToolInterUse {
  id: string;
  toolId: string;
  tool: Tool;
  useStartDate: string;
  useEndDate: string;
  status: string;
  notes: string | null;
  damageReported: boolean;
  damageDescription: string | null;
  relisedBy: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  description: string;
  categoryId: string;
  totalAmount: Decimal;
  paidAmount: Decimal;
  remainingAmount: Decimal;
  status: string;
  priority: string;
  dueDate: string;
  expenseDate: string;
  vendor?: {
    id: string;
    name: string;
    email: string | null;
  };
  category?: {
    id: string;
    name: string;
  };
}

export type ViewMode =
  | "list"
  | "calendar"
  | "kanban"
  | "invoices"
  | "files"
  | "team"
  | "comments"
  | "tools"
  | "expenses"
  | "worklogs"; // Add worklogs view mode

export const ROLE_OPTIONS = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
  { value: "LEADER", label: "Leader" },
  { value: "CONTRIBUTOR", label: "Contributor" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "FINANCIAL", label: "Financial" },
] as const;

export const PERMISSIONS = [
  { name: "canCreateTask", label: "Can Create Tasks" },
  { name: "canEditTask", label: "Can Edit Tasks" },
  { name: "canDeleteTask", label: "Can Delete Tasks" },
  { name: "canUploadFiles", label: "Can Upload Files" },
  { name: "canDeleteFiles", label: "Can Delete Files" },
  { name: "canViewFinancial", label: "Can View Financial" },
  { name: "canAddWorkLog", label: "Can Add Work Logs" },
];
