import { TaskStatus, Priority } from "@prisma/client";

export interface TimeEntry {
  id: string;
  description: string | null;
  hours: number;
  date: Date | string;
  timeIn: Date;
  timeOut: Date | null;
  userId: string;
  images: string[];
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
}
export interface Task {
  id: string;
  taskNumber: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  isAIGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  startTime: Date | string | null;
  endTime: Date | string | null;
  allocatedTime: string | null;
  project: {
    id: string;
    title: string;
    description: string | null;
    color: string | null;
  };
  assignees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    position: string;
  }>;
  freeLancerAssignees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    hourlyRate?: number | null;
    skills?: string[];
  }>;
  subtask: Array<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    estimatedHours: number | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  comment: Array<{
    id: string;
    content: string;
    commenterName: string;
    commenterId: string;
    commenterAvatar: string | null;
    commenterRole: string | null;
    liked: boolean;
    pinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    commentReply: Array<any>;
  }>;
  documents: Array<{
    id: string;
    name: string;
    originalName: string | null;
    url: string;
    size: number | null;
    mimeType: string | null;
    createdAt: Date;
  }>;
  timeEntries: TimeEntry[];
}

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-destructive text-white";
    case "MEDIUM":
      return "bg-orange-500 text-white";
    case "LOW":
      return "bg-yellow-500 text-white";
    default:
      return "bg-red-400 text-white";
  }
};

export const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO:
      return "bg-blue-500";
    case TaskStatus.IN_PROGRESS:
      return "bg-yellow-500";
    case TaskStatus.REVIEW:
      return "bg-yellow-500";
    case TaskStatus.COMPLETED:
      return "bg-green-500";
    default:
      return "bg-gray-400";
  }
};

export const formatStatus = (status: TaskStatus) => {
  return status.toLowerCase().replace("_", " ");
};
