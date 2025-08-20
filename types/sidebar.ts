import {
  InvoiceStatus,
  Priority,
  ProjectStatus,
  TaskStatus,
} from "@prisma/client";

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
  folder: Folder[];
  documents: Document[];
  comment: Comment[];
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

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  priority: Priority;
  status: TaskStatus;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface ProjectTeam {
  userId: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Comment {
  id: string;
  content: string;
  liked: boolean;
  createdAt: string;
  commenterName: string;
  commenterId: string;
  commenterAvatar: string;
  commenterRole: string;
  commentReply: CommentReply[];
}

export interface CommentReply {
  id: string;
  content: string;
  liked: boolean;
  createdAt: string;
  commenterName: string;
  commenterId: string;
  commenterAvatar: string;
  commenterRole: string;
}

export interface SidebarItem {
  title: string;
  url?: string;
  icon?: React.ComponentType<any>;
  color?: string;
  badge?: string | number;
  alwaysActive?: boolean;
  subitems?: SidebarItem[];
}

export interface AppSidebarProps {
  role: string;
  unreadCount?: number;
  projects?: Project[];
}
