export interface Project {
  id: string;
  title: string;
  status: string | null;
  starred: boolean;
  archived: boolean;
  managerId: string;
  updatedAt: string;
  createdAt: string;
  teamMembers?: any[];
  folder?: Folder[];
  tasks?: Task[];
}

export interface Folder {
  id: string;
  title: string;
  createdAt: string;
  notes?: Note[];
  Document?: Document[];
}

export interface Note {
  id: string;
  title: string;
}

export interface Document {
  id: string;
  originalName: string;
}

export interface Task {
  id: string;
  title: string;
  status: string | null;
  updatedAt: string;
}

export interface NavItem {
  title: string;
  url?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  badge?: string;
  subitems?: NavItem[];
  alwaysActive?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface SidebarData {
  navMain: NavSection[];
}
