import { Priority, ProjectStatus, TaskStatus, User } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
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
  dueDate: string;
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
  notes: Note[];
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

export interface Project {
  id: string;
  projectNumber: string;
  title: string;
  description: string | null;
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
}

export type ViewMode =
  | "list"
  | "calendar"
  | "kanban"
  | "invoices"
  | "files"
  | "team"
  | "comments";

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
];
