// data.ts
export const tasks = {
  "task-1": {
    id: "task-1",
    title: "Design system components",
    description:
      "Create reusable UI components for the design system including buttons, forms, cards, and navigation elements. Ensure consistency across all components and follow accessibility guidelines.",
    status: "in-progress",
    priority: "high",
    assignee: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      email: "sarah@company.com",
    },
    reporter: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    project: {
      id: "1",
      name: "E-commerce Platform",
      color: "#3b82f6",
    },
    dueDate: "2024-01-20",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    labels: ["Design", "UI/UX", "Frontend"],
    timeTracked: "12h 30m",
    timeEstimate: "20h",
  },
  "task-2": {
    id: "task-2",
    title: "API integration testing",
    description:
      "Test all API endpoints and error handling scenarios to ensure robust integration.",
    status: "review",
    priority: "medium",
    assignee: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=32&width=32",
      email: "mike@company.com",
    },
    reporter: {
      name: "Emily Davis",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    project: {
      id: "2",
      name: "Mobile App Backend",
      color: "#10b981",
    },
    dueDate: "2024-01-18",
    createdAt: "2024-01-08T10:00:00Z",
    updatedAt: "2024-01-14T16:45:00Z",
    labels: ["Backend", "Testing", "API"],
    timeTracked: "8h 15m",
    timeEstimate: "12h",
  },
};

export const mockSubtasks = [
  {
    id: "subtask-1",
    title: "Create button component",
    completed: true,
    assignee: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    priority: "high",
    dueDate: "2024-01-15",
  },
  {
    id: "subtask-2",
    title: "Design form components",
    completed: true,
    assignee: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    priority: "medium",
    dueDate: "2024-01-17",
  },
  {
    id: "subtask-3",
    title: "Implement card layouts",
    completed: false,
    assignee: {
      name: "Emily Davis",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    priority: "medium",
    dueDate: "2024-01-19",
  },
  {
    id: "subtask-4",
    title: "Navigation component",
    completed: false,
    assignee: {
      name: "Alex Wilson",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    priority: "low",
    dueDate: "2024-01-22",
  },
];

export const mockComments = [
  {
    id: "comment-1",
    author: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    content:
      "Great progress on the design system! The button component looks solid. Can we also add hover states?",
    createdAt: "2024-01-14T10:30:00Z",
  },
  {
    id: "comment-2",
    author: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    content:
      "Thanks! Yes, I'll add the hover states and focus indicators for accessibility.",
    createdAt: "2024-01-14T11:15:00Z",
  },
  {
    id: "comment-3",
    author: {
      name: "Emily Davis",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    content: "Should we also consider dark mode variants for all components?",
    createdAt: "2024-01-15T09:20:00Z",
  },
];

export const mockAttachments = [
  {
    id: "attachment-1",
    name: "design-system-mockups.figma",
    size: "2.4 MB",
    type: "figma",
    uploadedAt: "2024-01-12T14:00:00Z",
    uploadedBy: "Sarah Johnson",
  },
  {
    id: "attachment-2",
    name: "component-specifications.pdf",
    size: "1.8 MB",
    type: "pdf",
    uploadedAt: "2024-01-13T16:30:00Z",
    uploadedBy: "Mike Chen",
  },
];

export const teamMembers = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  { id: "2", name: "Mike Chen", avatar: "/placeholder.svg?height=32&width=32" },
  {
    id: "3",
    name: "Emily Davis",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "4",
    name: "Alex Wilson",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "5",
    name: "Lisa Brown",
    avatar: "/placeholder.svg?height=32&width=32",
  },
];
