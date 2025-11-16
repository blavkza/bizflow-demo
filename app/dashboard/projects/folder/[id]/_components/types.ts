import { User } from "@clerk/nextjs/server";
import { Project } from "@prisma/client";

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  lastModified: Date;
  thumbnail?: string;
  tags: string[];
  starred: boolean;
  shared: boolean;
  uploadProgress?: number;
  mimeType?: string;
  url?: string;
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

export interface FolderData {
  id: string;
  title: string;
  description?: string;
  documents?: FileItem[];
  notes?: Note[];

  Project?: {
    title: string;
    id: string;
    managerId: string;
    teamMembers?: ProjectTeam[];
  };
}

export interface FolderStats {
  totalFiles: number;
  totalSize: number;
  recentActivity: number;
  sharedFiles: number;
}

export type NoteColor = "blue" | "green" | "yellow" | "purple" | "pink";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  pinned: boolean;
  color: NoteColor;
}
