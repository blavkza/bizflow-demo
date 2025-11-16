import {
  BillingType,
  comment,
  Document,
  Employee,
  Folder,
  Priority,
  ProjectStatus,
  ProjectType,
  TaskStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Projects {
  id: string;
  projectNumber: string;
  title: string;
  description: string | null;
  clientId: string | null;
  managerId: string;
  status: ProjectStatus;
  priority: Priority;
  projectType: ProjectType;
  billingType: BillingType | null;
  archived: boolean;
  starred: boolean;
  startDate: Date | null;
  endDate: Date | null;
  deadline: Date | null;
  budget: number | null;
  currency: string;
  hourlyRate: number | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
  manager: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    avatar: string | null;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    timeEntries: number;
  };

  tasks: Task[];
  comments: comment;
  folder: Folder[];
  documants: Document;

  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
    totalAmount: string;
  }[];
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
  taskNumber: string;
  dueDate: string;
  createdAt: string;
}
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  description: string;
}
